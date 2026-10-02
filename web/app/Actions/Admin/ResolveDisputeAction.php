<?php

namespace App\Actions\Admin;

use App\Enums\JobStatus;
use App\Enums\TradieCompanyStatus;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\MemberCredit;
use App\Models\User;
use App\Notifications\TradieDisputeResolvedWarning;
use App\Services\JobStatusTransition;
use Illuminate\Support\Facades\DB;

final class ResolveDisputeAction
{
    public function __construct(private readonly JobStatusTransition $statusTransition) {}

    public function execute(Job $job, User $admin, array $data): void
    {
        DB::transaction(function () use ($job, $admin, $data): void {
            // tradie_at_fault closes as cancelled; all other outcomes close as confirmed
            $toStatus = $data['resolution'] === 'tradie_at_fault'
                ? JobStatus::Cancelled
                : JobStatus::Confirmed;

            $this->statusTransition->assertAllowed($job->status, $toStatus);

            $prevStatus = $job->status;
            $updates = [
                'status' => $toStatus,
                'requires_admin_review' => false,
            ];

            if ($toStatus === JobStatus::Confirmed) {
                $updates['confirmed_at'] = now();
            } else {
                $updates['cancelled_at'] = now();
                $updates['cancellation_reason'] = "Dispute resolved: {$data['resolution']}";
            }

            $job->update($updates);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => $toStatus,
                'changed_by_user_id' => $admin->id,
                'changed_by_system' => false,
                'note' => json_encode([
                    'resolution' => $data['resolution'],
                    'action_on_tradie' => $data['action_on_tradie'],
                    'credit_cents' => $data['issue_member_credit_cents'] ?? 0,
                    'admin_note' => $data['note'] ?? null,
                ]),
            ]);

            // Apply tradie action
            if ($data['action_on_tradie'] !== 'none' && $job->assigned_tradie_company_id) {
                $company = $job->assignedCompany;

                if (in_array($data['action_on_tradie'], ['suspend_7d', 'suspend_indefinite'])) {
                    $expiry = $data['action_on_tradie'] === 'suspend_7d'
                        ? 'expires '.now()->addDays(7)->toDateString()
                        : 'indefinite';

                    $company->update([
                        'status' => TradieCompanyStatus::Suspended,
                        'suspended_reason' => "Dispute resolution ({$expiry}): ".($data['note'] ?? ''),
                    ]);
                }

                // Notify tradie of resolution outcome (T6) for warn + both suspend types
                $company->owner->notify(new TradieDisputeResolvedWarning($job, $data['action_on_tradie']));
            }

            // Issue member credit if requested
            $creditCents = (int) ($data['issue_member_credit_cents'] ?? 0);
            if ($creditCents > 0) {
                MemberCredit::create([
                    'member_user_id' => $job->member_user_id,
                    'amount_cents' => $creditCents,
                    'reason' => "Dispute resolution credit for job {$job->public_id}".($data['note'] ? ": {$data['note']}" : ''),
                    'created_by_user_id' => $admin->id,
                    'expires_at' => now()->addYear(),
                ]);
            }
        });
    }
}
