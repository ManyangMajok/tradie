<?php

namespace App\Http\Controllers\Member;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $subscription = $user->memberSubscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        return Inertia::render('Member/Dashboard', [
            'subscription' => $subscription ? [
                'status' => $subscription->status->value,
                'plan_name' => $subscription->plan->name,
                'end_date' => $subscription->end_date?->toDateString(),
            ] : null,
            'recentJobs' => [],
        ]);
    }
}
