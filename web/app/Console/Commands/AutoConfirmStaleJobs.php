<?php

namespace App\Console\Commands;

use App\Enums\JobStatus;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\Review;
use App\Notifications\MemberJobAutoConfirmed;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoConfirmStaleJobs extends Command
{
    protected $signature = 'jobs:auto-confirm-stale';

    protected $description = 'Auto-confirm completed jobs with no review after 7 days';

    public function handle(): int
    {
        $jobs = Job::where('status', JobStatus::Completed)
            ->where('completed_at', '<', now()->subDays(7))
            ->whereDoesntHave('review')
            ->with(['member', 'assignedCompany'])
            ->get();

        foreach ($jobs as $job) {
            DB::transaction(function () use ($job): void {
                Review::create([
                    'job_id' => $job->id,
                    'member_user_id' => $job->member_user_id,
                    'tradie_company_id' => $job->assigned_tradie_company_id,
                    'work_completed_status' => 'yes',
                    'no_callout_fee_honoured' => true,
                    'discount_honoured' => 'na',
                    'stars' => 5,
                    'review_text' => null,
                    'was_auto_confirmed' => true,
                    'submitted_at' => now(),
                ]);

                $prevStatus = $job->status;
                $job->update([
                    'status' => JobStatus::Confirmed,
                    'confirmed_at' => now(),
                ]);

                JobStatusLog::create([
                    'job_id' => $job->id,
                    'from_status' => $prevStatus,
                    'to_status' => JobStatus::Confirmed,
                    'changed_by_user_id' => null,
                    'changed_by_system' => true,
                ]);
            });

            $job->member->notify(new MemberJobAutoConfirmed($job->fresh()));
        }

        $this->info("Auto-confirmed {$jobs->count()} job(s).");

        return self::SUCCESS;
    }
}
