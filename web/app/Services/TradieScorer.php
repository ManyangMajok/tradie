<?php

namespace App\Services;

use App\DTO\EligibleTradie;
use App\DTO\ScoringContext;

final class TradieScorer
{
    public function score(ScoringContext $ctx, EligibleTradie $tradie): float
    {
        $cfg = config('dispatch.scoring');
        $score = 0.0;

        // Plan boost — Premium = +100, Standard = 0
        $score += $tradie->planDispatchBoost;

        // Rating (1–5 scale × weight; unrated tradies default to 4.0)
        $rating = $tradie->ratingAverage ?? $cfg['default_rating_for_unrated'];
        $score += $rating * $cfg['rating_weight'];

        // Response time (30-day avg). Faster = more points, capped at max_points.
        if ($tradie->recentAvgResponseSeconds !== null) {
            $minutes = $tradie->recentAvgResponseSeconds / 60;
            $score += max(0.0, min(
                (float) $cfg['response_time_max_points'],
                $cfg['response_time_max_points'] - $minutes
            ));
        } else {
            $score += $cfg['neutral_response_time_points'];
        }

        // Acceptance rate (30-day). Requires at least N offers to count; else neutral.
        if ($tradie->recentOffersCount >= $cfg['acceptance_min_offers']) {
            $rate = $tradie->recentOffersCount > 0
                ? $tradie->recentAcceptedCount / $tradie->recentOffersCount
                : 0.0;
            $score += $rate * $cfg['acceptance_rate_weight'];
        } else {
            $score += $cfg['neutral_acceptance_points'];
        }

        // Workload penalty — 0 jobs = 0 penalty, capped at workload_penalty_cap
        $score -= min($tradie->currentWorkload, $cfg['workload_penalty_cap']) * $cfg['workload_penalty_per_job'];

        // Member plan priority bonus
        if ($ctx->memberPriorityDispatch) {
            $score += $cfg['member_priority_bonus'];
        }

        // Dispute penalty — each recent dispute is a strong negative signal
        $score -= $tradie->disputesLast30Days * $cfg['dispute_penalty'];

        // Expired offers penalty — tradies who ignore leads drop quickly
        $score -= $tradie->expiredOffersLast7Days * $cfg['expiry_penalty'];

        return $score;
    }
}
