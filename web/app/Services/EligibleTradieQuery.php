<?php

namespace App\Services;

use App\DTO\EligibleTradie;
use App\Models\Job;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class EligibleTradieQuery
{
    /**
     * Return all tradies eligible to receive an offer for this job.
     *
     * Eligibility requires (see 05-dispatch-engine.md §4):
     *  1. Company approved + not soft-deleted
     *  2. Active (or grace-period past_due) subscription
     *  3. Active category match
     *  4. Active service area matching job's suburb
     *  5. Not already offered this job in any round
     *  6. Not currently flagged for dispute review
     *  7. Within operating hours OR accepts_emergency (for emergency jobs)
     *
     * Each returned DTO carries the scoring fields pre-loaded so
     * TradieScorer can run without additional queries.
     *
     * @return Collection<int, EligibleTradie>
     */
    public function get(Job $job): Collection
    {
        $graceDays = config('dispatch.past_due_grace_days', 3);
        $disputeLookback = config('dispatch.scoring.dispute_lookback_days', 30);
        $expiryLookback = config('dispatch.scoring.expiry_lookback_days', 7);

        $now = Carbon::now();
        // Day of week: 0=Sunday … 6=Saturday (matches tradie_availability.day_of_week)
        $dayOfWeek = (int) $now->dayOfWeek;
        $timeNow = $now->format('H:i:s');
        $isEmergency = $job->urgency->value === 'emergency';

        $results = DB::select(
            /** @lang MySQL */
            <<<'SQL'
            SELECT
                tc.id,
                COALESCE(tp.dispatch_rank_boost, 0)              AS plan_dispatch_boost,
                tc.rating_average,

                -- 30-day avg response time (seconds, from accepted offers only)
                (
                    SELECT AVG(jo_r.response_time_seconds)
                    FROM   job_offers jo_r
                    WHERE  jo_r.tradie_company_id = tc.id
                      AND  jo_r.status = 'accepted'
                      AND  jo_r.accepted_at >= NOW() - INTERVAL 30 DAY
                ) AS recent_avg_response_seconds,

                -- 30-day offer + acceptance counts
                (
                    SELECT COUNT(*)
                    FROM   job_offers jo_o
                    WHERE  jo_o.tradie_company_id = tc.id
                      AND  jo_o.created_at >= NOW() - INTERVAL 30 DAY
                      AND  jo_o.status != 'superseded'
                ) AS recent_offers_count,

                (
                    SELECT COUNT(*)
                    FROM   job_offers jo_a
                    WHERE  jo_a.tradie_company_id = tc.id
                      AND  jo_a.status = 'accepted'
                      AND  jo_a.accepted_at >= NOW() - INTERVAL 30 DAY
                ) AS recent_accepted_count,

                -- Current workload: assigned + on_the_way + in_progress
                (
                    SELECT COUNT(*)
                    FROM   jobs j_w
                    WHERE  j_w.assigned_tradie_company_id = tc.id
                      AND  j_w.status IN ('assigned','tradie_on_the_way','in_progress')
                ) AS current_workload,

                -- Disputes in last 30 days
                (
                    SELECT COUNT(*)
                    FROM   jobs j_d
                    WHERE  j_d.assigned_tradie_company_id = tc.id
                      AND  j_d.status = 'disputed'
                      AND  j_d.updated_at >= NOW() - INTERVAL :dispute_lookback DAY
                ) AS disputes_last_30,

                -- Expired offers in last 7 days
                (
                    SELECT COUNT(*)
                    FROM   job_offers jo_e
                    WHERE  jo_e.tradie_company_id = tc.id
                      AND  jo_e.status = 'expired'
                      AND  jo_e.expired_at >= NOW() - INTERVAL :expiry_lookback DAY
                ) AS expired_offers_last_7

            FROM tradie_companies tc

            -- Must have an active (or grace-period past_due) subscription
            JOIN tradie_subscriptions ts
              ON  ts.tradie_company_id = tc.id
              AND ts.status IN ('active','past_due')
              AND (
                    ts.status = 'active'
                    OR ts.end_date >= NOW() - INTERVAL :grace_days DAY
                  )

            -- Must cover the requested category
            JOIN tradie_company_categories tcc
              ON  tcc.tradie_company_id = tc.id
              AND tcc.tradie_category_id = :category_id
              AND tcc.is_active = true

            -- Must cover the job's suburb
            JOIN tradie_service_areas tsa
              ON  tsa.tradie_company_id = tc.id
              AND tsa.suburb_id         = :suburb_id
              AND tsa.is_active         = true

            -- Join the plan to get dispatch_rank_boost
            LEFT JOIN tradie_subscriptions ts_latest
              ON  ts_latest.id = (
                    SELECT id FROM tradie_subscriptions
                    WHERE  tradie_company_id = tc.id
                      AND  status IN ('active','past_due')
                    ORDER  BY created_at DESC
                    LIMIT  1
                  )
            LEFT JOIN tradie_plans tp ON tp.id = ts_latest.tradie_plan_id

            -- Availability: within hours OR accepts_emergency for emergency jobs
            LEFT JOIN tradie_availability ta
              ON  ta.tradie_company_id = tc.id
              AND ta.day_of_week       = :day_of_week

            WHERE tc.status     = 'approved'
              AND tc.deleted_at IS NULL

            -- Not already offered this job in any previous round
              AND NOT EXISTS (
                    SELECT 1 FROM job_offers jo_prev
                    WHERE  jo_prev.job_id             = :job_id
                      AND  jo_prev.tradie_company_id  = tc.id
                  )

            -- Not currently flagged (active dispute review on another job)
              AND NOT EXISTS (
                    SELECT 1 FROM jobs j_flag
                    WHERE  j_flag.assigned_tradie_company_id = tc.id
                      AND  j_flag.requires_admin_review      = true
                  )

            -- Operating hours check
              AND (
                    -- Within today's window
                    (
                      ta.opens_at IS NOT NULL
                      AND ta.closes_at IS NOT NULL
                      AND CAST(:time_now AS TIME) BETWEEN ta.opens_at AND ta.closes_at
                    )
                    -- OR emergency and accepts_emergency
                    OR (:is_emergency = true AND ta.accepts_emergency = true)
                  )
            SQL,
            [
                'dispute_lookback' => $disputeLookback,
                'expiry_lookback' => $expiryLookback,
                'grace_days' => $graceDays,
                'category_id' => $job->tradie_category_id,
                'suburb_id' => $job->property->suburb_id,
                'day_of_week' => $dayOfWeek,
                'time_now' => $timeNow,
                'is_emergency' => $isEmergency ? 1 : 0,
                'job_id' => $job->id,
            ]
        );

        return collect($results)->map(fn (object $row) => new EligibleTradie(
            id: $row->id,
            planDispatchBoost: (float) $row->plan_dispatch_boost,
            ratingAverage: $row->rating_average !== null ? (float) $row->rating_average : null,
            recentAvgResponseSeconds: $row->recent_avg_response_seconds !== null
                ? (float) $row->recent_avg_response_seconds : null,
            recentOffersCount: (int) $row->recent_offers_count,
            recentAcceptedCount: (int) $row->recent_accepted_count,
            currentWorkload: (int) $row->current_workload,
            disputesLast30Days: (int) $row->disputes_last_30,
            expiredOffersLast7Days: (int) $row->expired_offers_last_7,
        ));
    }
}
