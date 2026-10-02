<?php

namespace App\Jobs\Dispatch;

use App\Actions\Dispatch\DispatchJobAction;
use App\DTO\ScoringContext;
use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Models\Job;
use App\Models\JobOffer;
use App\Services\EligibleTradieQuery;
use App\Services\TradieScorer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AdvanceToNextRank implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly int $jobId,
        public readonly int $round,
    ) {}

    public function handle(
        DispatchJobAction $dispatch,
        EligibleTradieQuery $eligibilityQuery,
        TradieScorer $scorer,
    ): void {
        $job = Job::find($this->jobId);

        if ($job === null || $job->status !== JobStatus::Offered) {
            return; // already resolved
        }

        if ($job->selected_tradie_company_id !== null) {
            $dispatch->execute($job);

            return;
        }

        $offersPerRound = config('dispatch.offers_per_round', 3);

        // Find the highest rank already used in this round
        $maxRankUsed = JobOffer::where('job_id', $this->jobId)
            ->where('round', $this->round)
            ->max('rank_in_round') ?? 0;

        $nextRank = $maxRankUsed + 1;

        if ($nextRank > $offersPerRound) {
            // This round is exhausted — start a new round via DispatchJobAction
            Log::channel('dispatch')->info(
                "[dispatch] job={$job->public_id} round={$this->round} exhausted. starting next round."
            );
            $dispatch->execute($job->fresh());

            return;
        }

        // Re-query eligible tradies excluding all already-offered ones
        $eligible = $eligibilityQuery->get($job);

        if ($eligible->isEmpty()) {
            Log::channel('dispatch')->info(
                "[dispatch] job={$job->public_id} round={$this->round} rank={$nextRank} no more candidates. escalating."
            );
            $dispatch->execute($job->fresh());

            return;
        }

        $ctx = ScoringContext::forJob($job);

        // Score remaining candidates; take the top one (already-offered are excluded by the query)
        $sorted = $eligible
            ->map(fn ($t) => [$t, $scorer->score($ctx, $t)])
            ->sortByDesc(fn ($pair) => $pair[1])
            ->values();

        if ($sorted->isEmpty()) {
            $dispatch->execute($job->fresh());

            return;
        }

        [$tradie, $score] = $sorted->first();

        $windows = config('dispatch.windows_seconds');
        $seconds = $windows[$job->urgency->value] ?? $windows['flexible'];
        $expiresAt = now()->addSeconds($seconds);

        $offer = JobOffer::create([
            'job_id' => $job->id,
            'tradie_company_id' => $tradie->id,
            'round' => $this->round,
            'rank_in_round' => $nextRank,
            'score' => $score,
            'status' => OfferStatus::Offered,
            'offered_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        Log::channel('dispatch')->info(
            "[dispatch] job={$job->public_id} round={$this->round} offer={$offer->id} rank={$nextRank} "
            ."tradie={$tradie->id} score={$score}"
        );

        SendLeadNotification::dispatch($offer->id);
        ExpireOffer::dispatch($offer->id)->delay(now()->diffInSeconds($expiresAt));
    }
}
