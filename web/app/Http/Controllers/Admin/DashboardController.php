<?php

namespace App\Http\Controllers\Admin;

use App\Enums\JobStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\TradieCompanyStatus;
use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\MemberSubscription;
use App\Models\TradieCompany;
use App\Models\TradieSubscription;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $activeStatuses = [
            JobStatus::Assigned->value,
            JobStatus::TradieOnTheWay->value,
            JobStatus::InProgress->value,
            JobStatus::Rescheduled->value,
        ];

        $counts = [
            'active_members' => MemberSubscription::where('status', SubscriptionStatus::Active)
                ->distinct('user_id')->count(),
            'active_tradies' => TradieSubscription::where('status', SubscriptionStatus::Active)
                ->distinct('tradie_company_id')->count(),
            'jobs_this_month' => Job::whereMonth('submitted_at', now()->month)
                ->whereYear('submitted_at', now()->year)->count(),
            'jobs_requiring_review' => Job::where('requires_admin_review', true)->count(),
        ];

        $attention = [
            'pending_tradie_applications' => TradieCompany::where('status', TradieCompanyStatus::PendingReview)->count(),
            'disputed_jobs' => Job::where('status', JobStatus::Disputed)->count(),
            'unassigned_jobs' => Job::where('status', JobStatus::PendingDispatch)
                ->where('requires_admin_review', true)->count(),
            'renewals_in_7_days' => MemberSubscription::where('status', SubscriptionStatus::Active)
                ->whereBetween('end_date', [now()->toDateString(), now()->addDays(7)->toDateString()])
                ->count(),
        ];

        $liveJobs = Job::whereIn('status', $activeStatuses)
            ->with(['member', 'category', 'assignedCompany', 'property.suburb'])
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(fn (Job $j) => [
                'id' => $j->id,
                'public_id' => $j->public_id,
                'status' => $j->status->value,
                'urgency' => $j->urgency->value,
                'category' => $j->category?->name,
                'suburb' => $j->property?->suburb?->name,
                'member_name' => $j->member->first_name.' '.$j->member->last_name,
                'tradie_name' => $j->assignedCompany?->business_name,
                'submitted_at' => $j->submitted_at->toIso8601String(),
            ]);

        return Inertia::render('Admin/Overview', compact('counts', 'attention', 'liveJobs'));
    }
}
