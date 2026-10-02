<?php

namespace App\Actions\Dispatch;

use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Exceptions\Dispatch\OfferExpiredException;
use App\Exceptions\Dispatch\OfferNoLongerAvailableException;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AcceptOfferAction
{
    public function execute(JobOffer $offer, User $tradieUser): Job
    {
        return DB::transaction(function () use ($offer, $tradieUser): Job {
            // Lock this offer row to prevent double-accept races
            $offer = JobOffer::lockForUpdate()->findOrFail($offer->id);

            if ($offer->status !== OfferStatus::Offered) {
                throw new OfferNoLongerAvailableException;
            }

            if (now()->gt($offer->expires_at)) {
                throw new OfferExpiredException;
            }

            $companyId = $tradieUser->tradieCompany?->id;
            abort_if($companyId !== $offer->tradie_company_id, 403);

            // Accept this offer
            $offer->update([
                'status' => OfferStatus::Accepted,
                'accepted_at' => now(),
            ]);

            // Assign the job
            $job = Job::lockForUpdate()->findOrFail($offer->job_id);
            if ($job->status !== JobStatus::Offered) {
                throw new OfferNoLongerAvailableException;
            }

            $job->update([
                'status' => JobStatus::Assigned,
                'assigned_tradie_company_id' => $offer->tradie_company_id,
                'assigned_at' => now(),
            ]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => JobStatus::Offered,
                'to_status' => JobStatus::Assigned,
                'changed_by_user_id' => $tradieUser->id,
                'changed_by_system' => false,
                'note' => "Accepted by tradie company #{$offer->tradie_company_id}",
            ]);

            // Supersede sibling offers in the same round (defensive — sequential only has 1)
            JobOffer::where('job_id', $job->id)
                ->where('round', $offer->round)
                ->where('id', '!=', $offer->id)
                ->whereIn('status', [OfferStatus::Offered->value, OfferStatus::Viewed->value])
                ->update([
                    'status' => OfferStatus::Superseded->value,
                    'superseded_at' => now(),
                ]);

            Log::channel('dispatch')->info(
                "[dispatch] job={$job->public_id} offer={$offer->id} accepted by company={$offer->tradie_company_id}"
            );

            return $job->fresh();
        });
    }
}
