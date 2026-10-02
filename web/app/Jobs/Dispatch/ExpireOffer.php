<?php

namespace App\Jobs\Dispatch;

use App\Enums\OfferStatus;
use App\Models\JobOffer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireOffer implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly int $offerId) {}

    public function handle(): void
    {
        $offer = JobOffer::find($this->offerId);

        if ($offer === null || $offer->status !== OfferStatus::Offered) {
            return;
        }

        DB::transaction(function () use ($offer): void {
            $offer = JobOffer::lockForUpdate()->find($this->offerId);

            if ($offer === null || $offer->status !== OfferStatus::Offered) {
                return;
            }

            $offer->update([
                'status' => OfferStatus::Expired,
                'expired_at' => now(),
            ]);

            Log::channel('dispatch')->info(
                "[dispatch] offer={$offer->id} expired. advancing rank."
            );
        });

        AdvanceToNextRank::dispatch($offer->job_id, $offer->round);
    }
}
