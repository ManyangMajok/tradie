<?php

namespace App\Actions\Job;

use App\Enums\JobStatus;
use App\Models\Job;
use App\Models\JobCompletionReport;
use App\Models\JobStatusLog;
use App\Models\User;
use App\Services\JobStatusTransition;
use Illuminate\Support\Facades\DB;

final class SubmitCompletionReportAction
{
    public function __construct(private readonly JobStatusTransition $statusTransition) {}

    public function execute(Job $job, User $tradie, array $data): JobCompletionReport
    {
        return DB::transaction(function () use ($job, $tradie, $data): JobCompletionReport {
            $this->statusTransition->assertAllowed($job->status, JobStatus::Completed);

            $report = JobCompletionReport::create([
                'job_id' => $job->id,
                'tradie_company_id' => $job->assigned_tradie_company_id,
                'submitted_by_user_id' => $tradie->id,
                'summary_of_work' => $data['summary_of_work'],
                'invoice_total_cents' => $data['invoice_total_cents'],
                'no_callout_fee_confirmed' => $data['no_callout_fee_confirmed'],
                'discount_applied' => $data['discount_applied'],
                'discount_amount_cents' => $data['discount_amount_cents'] ?? null,
                'invoice_document_path' => $data['invoice_document_path'] ?? null,
                'completion_notes' => $data['completion_notes'] ?? null,
                'submitted_at' => now(),
            ]);

            $prevStatus = $job->status;
            $job->update([
                'status' => JobStatus::Completed,
                'completed_at' => now(),
            ]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::Completed,
                'changed_by_user_id' => $tradie->id,
                'changed_by_system' => false,
            ]);

            return $report;
        });
    }
}
