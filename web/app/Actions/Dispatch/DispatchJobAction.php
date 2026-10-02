<?php

namespace App\Actions\Dispatch;

use App\DTO\ScoringContext;
use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Enums\UserRole;
use App\Jobs\Dispatch\ExpireOffer;
use App\Jobs\Dispatch\SendLeadNotification;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\User;
use App\Notifications\AdminJobUnassigned;
use App\Notifications\MemberJobDelayed;
use App\Services\EligibleTradieQuery;
use App\Services\TradieScorer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class DispatchJobAction
{
    public function __construct(
        private EligibleTradieQuery $eligibilityQuery,
        private TradieScorer $scorer,
    ) {}

    public function execute(Job $job): void
    {
        if ($job->selected_tradie_company_id !== null) {
            DB::transaction(function () use ($job): void {
                $locked = Job::whereKey($job->id)->lockForUpdate()->firstOrFail();
                if ($locked->status !== JobStatus::Offered || $locked->offers()->where('status', OfferStatus::Offered)->exists()) {
                    return;
                }
                $this->escalateToAdmin($locked);
            });

            return;
        }

        $maxRounds = config('dispatch.max_rounds', 2);

        // Determine target round (next after the highest round already attempted)
        $currentRound = JobOffer::where('job_id', $job->id)->max('round') ?? 0;
        $targetRound = $currentRound + 1;

        if ($targetRound > $maxRounds) {
            $this->escalateToAdmin($job);

            return;
        }

        // Query + score eligible tradies
        $eligible = $this->eligibilityQuery->get($job);

        if ($eligible->isEmpty()) {
            Log::channel('dispatch')->info(
                "[dispatch] job={$job->public_id} round={$targetRound} eligible=0 → escalating"
            );
            $this->escalateToAdmin($job);

            return;
        }

        $ctx = ScoringContext::forJob($job);
        $offersPerRound = config('dispatch.offers_per_round', 3);

        $scored = $eligible
            ->map(fn ($t) => [$t, $this->scorer->score($ctx, $t)])
            ->sortByDesc(fn ($pair) => $pair[1])
            ->values()
            ->take($offersPerRound);

        $topIds = $scored->map(fn ($pair) => $pair[0]->id)->implode(', ');
        Log::channel('dispatch')->info(
            "[dispatch] job={$job->public_id} round={$targetRound} eligible={$eligible->count()} "
            ."top_tradies=[{$topIds}]"
        );

        // Sequential mode: offer to rank #1 only
        $mode = config('dispatch.mode', 'sequential');
        $toOffer = $mode === 'parallel' ? $scored : $scored->take(1);

        DB::transaction(function () use ($job, $toOffer, $targetRound): void {
            foreach ($toOffer as $rank => [$tradie, $score]) {
                JobOffer::create([
                    'job_id' => $job->id,
                    'tradie_company_id' => $tradie->id,
                    'round' => $targetRound,
                    'rank_in_round' => $rank + 1,
                    'score' => $score,
                    'status' => OfferStatus::Offered,
                    'offered_at' => now(),
                    'expires_at' => $this->expiresAt($job),
                ]);
            }

            $prevStatus = $job->status;
            $job->status = JobStatus::Offered;
            $job->dispatched_at = $job->dispatched_at ?? now();
            $job->dispatch_round = $targetRound;
            $job->save();

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::Offered,
                'changed_by_system' => true,
                'note' => "Round {$targetRound} started",
            ]);
        });

        // Outside the transaction: queue notifications and expiry jobs
        $freshOffers = JobOffer::where('job_id', $job->id)
            ->where('round', $targetRound)
            ->get();

        foreach ($freshOffers as $offer) {
            SendLeadNotification::dispatch($offer->id);
            ExpireOffer::dispatch($offer->id)
                ->delay(now()->diffInSeconds($offer->expires_at));
        }
    }

    private function expiresAt(Job $job): Carbon
    {
        $windows = config('dispatch.windows_seconds');
        $seconds = $windows[$job->urgency->value] ?? $windows['flexible'];

        return now()->addSeconds($seconds);
    }

    private function escalateToAdmin(Job $job): void
    {
        DB::transaction(function () use ($job): void {
            $prevStatus = $job->status;
            $job->status = JobStatus::PendingDispatch;
            $job->requires_admin_review = true;
            $job->save();

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::PendingDispatch,
                'changed_by_system' => true,
                'note' => $job->selected_tradie_company_id
                    ? 'Chosen tradie did not accept. Member can choose again; admin notified.'
                    : 'All dispatch rounds exhausted — escalated to admin',
            ]);
        });

        Log::channel('dispatch')->info(
            "[dispatch] job={$job->public_id} all offers in all rounds exhausted. escalating to admin."
        );

        // Notify the submitting member their request is delayed (J6).
        $job->member->notify(new MemberJobDelayed($job));

        // Notify all admin users so the job gets manually assigned (X2).
        $admins = User::where('role', UserRole::Admin)->get();
        Notification::send($admins, new AdminJobUnassigned($job));
    }
}
