<?php

namespace App\Actions\Admin;

use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class ManuallyAssignJobAction
{
    public function execute(Job $job, TradieCompany $company, User $admin, ?string $note = null): Job
    {
        return DB::transaction(function () use ($job, $company, $admin, $note): Job {
            $latestRound = JobOffer::where('job_id', $job->id)->max('round') ?? 0;

            JobOffer::create([
                'job_id' => $job->id,
                'tradie_company_id' => $company->id,
                'round' => $latestRound + 1,
                'rank_in_round' => 1,
                'score' => null,
                'status' => OfferStatus::Accepted,
                'offered_at' => now(),
                'accepted_at' => now(),
                'expires_at' => now()->addDay(),
            ]);

            $prevStatus = $job->status;
            $job->update([
                'status' => JobStatus::Assigned,
                'assigned_tradie_company_id' => $company->id,
                'assigned_at' => now(),
                'requires_admin_review' => false,
                'dispatch_round' => $latestRound + 1,
            ]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::Assigned,
                'changed_by_user_id' => $admin->id,
                'changed_by_system' => false,
                'note' => 'Admin override'.($note ? ": {$note}" : ''),
            ]);

            return $job->fresh();
        });
    }
}
