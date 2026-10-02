<?php

namespace App\Actions\Dispatch;

use App\Enums\OfferStatus;
use App\Exceptions\Dispatch\OfferNoLongerAvailableException;
use App\Jobs\Dispatch\AdvanceToNextRank;
use App\Models\JobOffer;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeclineOfferAction
{
    public function execute(JobOffer $offer, User $tradieUser, ?string $reason = null): void
    {
        DB::transaction(function () use ($offer, $tradieUser, $reason): void {
            $offer = JobOffer::lockForUpdate()->findOrFail($offer->id);

            if ($offer->status !== OfferStatus::Offered) {
                throw new OfferNoLongerAvailableException;
            }

            $companyId = $tradieUser->tradieCompany?->id;
            abort_if($companyId !== $offer->tradie_company_id, 403);

            $offer->update([
                'status' => OfferStatus::Declined,
                'declined_at' => now(),
                'declined_reason' => $reason,
            ]);

            Log::channel('dispatch')->info(
                "[dispatch] offer={$offer->id} declined by company={$offer->tradie_company_id} reason={$reason}"
            );
        });

        AdvanceToNextRank::dispatch($offer->job_id, $offer->round);
    }
}
