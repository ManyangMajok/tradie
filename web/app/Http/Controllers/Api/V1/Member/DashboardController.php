<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Enums\JobStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/v1/member/dashboard
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        $subscription = $user->memberSubscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        $activeJobs = Job::where('member_user_id', $user->id)
            ->with(['category', 'property.suburb'])
            ->whereNotIn('status', [
                JobStatus::Confirmed->value,
                JobStatus::Cancelled->value,
            ])
            ->latest('submitted_at')
            ->limit(3)
            ->get();

        $totalJobsThisYear = Job::where('member_user_id', $user->id)
            ->whereYear('submitted_at', now()->year)
            ->count();

        $totalSavedCents = Job::where('member_user_id', $user->id)
            ->whereHas('completionReport')
            ->with('completionReport')
            ->get()
            ->sum(fn ($j) => $j->completionReport?->discount_amount_cents ?? 0);

        $propertiesCount = $user->properties()->whereNull('deleted_at')->count();

        return response()->json([
            'stats' => [
                'jobs_this_year' => $totalJobsThisYear,
                'saved_cents' => $totalSavedCents,
                'properties' => $propertiesCount,
            ],
            'active_jobs' => $activeJobs,
            'subscription' => $subscription ? [
                'status' => $subscription->status->value,
                'plan_name' => $subscription->plan->name,
                'end_date' => $subscription->end_date?->toDateString(),
            ] : null,
        ]);
    }
}
