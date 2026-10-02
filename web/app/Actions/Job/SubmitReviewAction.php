<?php

namespace App\Actions\Job;

use App\Enums\JobStatus;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\Review;
use App\Models\User;
use App\Services\JobStatusTransition;
use Illuminate\Support\Facades\DB;

final class SubmitReviewAction
{
    public function __construct(private readonly JobStatusTransition $statusTransition) {}

    public function execute(Job $job, User $member, array $data): Review
    {
        return DB::transaction(function () use ($job, $member, $data): Review {
            $review = Review::create([
                'job_id' => $job->id,
                'member_user_id' => $member->id,
                'tradie_company_id' => $job->assigned_tradie_company_id,
                'work_completed_status' => $data['work_completed_status'],
                'no_callout_fee_honoured' => $data['no_callout_fee_honoured'],
                'discount_honoured' => $data['discount_honoured'],
                'stars' => $data['stars'],
                'review_text' => $data['review_text'] ?? null,
                'was_auto_confirmed' => false,
                'submitted_at' => now(),
            ]);

            $toStatus = $review->isPositive() ? JobStatus::Confirmed : JobStatus::Disputed;

            $this->statusTransition->assertAllowed($job->status, $toStatus);

            $prevStatus = $job->status;
            $updates = ['status' => $toStatus];

            if ($toStatus === JobStatus::Confirmed) {
                $updates['confirmed_at'] = now();
            } else {
                $updates['requires_admin_review'] = true;
            }

            $job->update($updates);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => $toStatus,
                'changed_by_user_id' => $member->id,
                'changed_by_system' => false,
            ]);

            $company = $job->assignedCompany;
            $count = $company->rating_count ?? 0;
            $avg = $company->rating_average ?? 0.0;
            $company->update([
                'rating_average' => round((($avg * $count) + $data['stars']) / ($count + 1), 2),
                'rating_count' => $count + 1,
            ]);

            return $review;
        });
    }
}
