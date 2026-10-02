<?php

namespace App\Http\Controllers\Admin;

use App\Enums\JobStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\TradieCompanyStatus;
use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\MemberSubscription;
use App\Models\Review;
use App\Models\TradieCompany;
use App\Models\TradieSubscription;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class MetricsController extends Controller
{
    public function __invoke(): Response
    {
        $metrics = Cache::remember('admin.metrics', 600, function (): array {
            return [
                'total_jobs' => Job::count(),
                'jobs_this_month' => Job::whereMonth('submitted_at', now()->month)
                    ->whereYear('submitted_at', now()->year)->count(),
                'jobs_by_status' => Job::selectRaw('status, count(*) as total')
                    ->groupBy('status')
                    ->pluck('total', 'status'),
                'confirmed_jobs' => Job::where('status', JobStatus::Confirmed)->count(),
                'disputed_jobs' => Job::where('status', JobStatus::Disputed)->count(),
                'avg_stars' => round((float) Review::avg('stars'), 2),
                'active_member_subs' => MemberSubscription::where('status', SubscriptionStatus::Active)->count(),
                'active_tradie_subs' => TradieSubscription::where('status', SubscriptionStatus::Active)->count(),
                'pending_applications' => TradieCompany::where('status', TradieCompanyStatus::PendingReview)->count(),
                'avg_tradie_rating' => round((float) TradieCompany::whereNotNull('rating_average')->avg('rating_average'), 2),
            ];
        });

        return Inertia::render('Admin/Metrics', ['metrics' => $metrics]);
    }
}
