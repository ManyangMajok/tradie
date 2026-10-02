<?php

namespace App\Jobs\Dispatch;

use App\Enums\OfferStatus;
use App\Models\JobOffer;
use App\Notifications\TradieLeadOffered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendLeadNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public function __construct(public readonly int $offerId) {}

    public function handle(): void
    {
        $offer = JobOffer::with(['job.property.suburb', 'job.category', 'company.owner'])
            ->find($this->offerId);

        if ($offer === null || $offer->status !== OfferStatus::Offered) {
            return;
        }

        $offer->update(['status' => OfferStatus::Offered]); // touch offered_at if null

        $tradieUser = $offer->company->owner;
        $tradieUser->notify(new TradieLeadOffered($offer));
    }
}
