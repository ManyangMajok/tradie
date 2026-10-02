<?php

namespace App\Actions\Dispatch;

use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Jobs\Dispatch\ExpireOffer;
use App\Jobs\Dispatch\SendLeadNotification;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\TradieCompany;
use App\Services\AvailableTradies;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SelectTradieAction
{
    public function __construct(private AvailableTradies $available) {}

    public function execute(Job $job, int $companyId): void
    {
        DB::transaction(function () use ($job, $companyId) {
            $locked = Job::whereKey($job->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === JobStatus::PendingDispatch, 409, 'This job already has an active offer or assignment.');
            // Recheck eligibility at submission: the list may have changed since it was displayed.
            TradieCompany::whereKey($companyId)->lockForUpdate()->first();
            if (! $this->available->forJob($locked)->contains('id', $companyId)) {
                throw ValidationException::withMessages([
                    'selected_tradie_company_id' => 'This tradie is no longer available for this job. Please choose another tradie.',
                ]);
            }
            $round = ($locked->offers()->max('round') ?? 0) + 1;
            $seconds = config('dispatch.windows_seconds.'.$locked->urgency->value);
            $offer = JobOffer::create([
                'job_id' => $locked->id, 'tradie_company_id' => $companyId,
                'round' => $round, 'rank_in_round' => 1, 'score' => null,
                'status' => OfferStatus::Offered, 'offered_at' => now(),
                'expires_at' => now()->addSeconds($seconds),
            ]);
            $locked->update([
                'selected_tradie_company_id' => $companyId, 'status' => JobStatus::Offered,
                'dispatched_at' => $locked->dispatched_at ?? now(), 'dispatch_round' => $round,
                'requires_admin_review' => false,
            ]);
            JobStatusLog::create([
                'job_id' => $locked->id, 'from_status' => JobStatus::PendingDispatch,
                'to_status' => JobStatus::Offered, 'changed_by_user_id' => $locked->member_user_id,
                'changed_by_system' => false, 'note' => 'Member selected their tradie.',
            ]);
            SendLeadNotification::dispatch($offer->id)->afterCommit();
            ExpireOffer::dispatch($offer->id)->delay($offer->expires_at)->afterCommit();
        });
        $job->refresh();
    }
}
