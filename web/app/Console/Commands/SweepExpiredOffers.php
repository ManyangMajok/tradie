<?php

namespace App\Console\Commands;

use App\Enums\OfferStatus;
use App\Jobs\Dispatch\AdvanceToNextRank;
use App\Models\JobOffer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SweepExpiredOffers extends Command
{
    protected $signature = 'dispatch:sweep-expired-offers';

    protected $description = 'Safety-net sweep: expire any offered job_offers past their expiry time';

    public function handle(): int
    {
        $stale = JobOffer::where('status', OfferStatus::Offered)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($stale as $offer) {
            DB::transaction(function () use ($offer): void {
                $offer = JobOffer::lockForUpdate()->find($offer->id);
                if ($offer === null || $offer->status !== OfferStatus::Offered) {
                    return;
                }
                $offer->update([
                    'status' => OfferStatus::Expired,
                    'expired_at' => now(),
                ]);
            });

            AdvanceToNextRank::dispatch($offer->job_id, $offer->round);
        }

        if ($stale->isNotEmpty()) {
            $this->info("Swept {$stale->count()} expired offer(s).");
        }

        return self::SUCCESS;
    }
}
