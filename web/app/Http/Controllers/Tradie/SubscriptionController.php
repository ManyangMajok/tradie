<?php

namespace App\Http\Controllers\Tradie;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function show(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $subscription = $company->subscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        return Inertia::render('Tradie/Subscription', [
            'subscription' => $subscription ? [
                'status' => $subscription->status->value,
                'plan' => [
                    'name' => $subscription->plan->name,
                    'yearly_price_cents' => $subscription->plan->yearly_price_cents,
                    'dispatch_rank_boost' => $subscription->plan->dispatch_rank_boost,
                    'featured_listing' => $subscription->plan->featured_listing,
                ],
                'start_date' => $subscription->start_date?->toDateString(),
                'end_date' => $subscription->end_date?->toDateString(),
                'auto_renew' => $subscription->auto_renew,
                'canceled_at' => $subscription->canceled_at?->toIso8601String(),
            ] : null,
            'has_stripe_customer' => true,
        ]);
    }

    public function portal(Request $request): RedirectResponse
    {
        return redirect()->route('tradie.subscription')
            ->with('success', 'Demo billing: no card details or real charges are required.');
    }
}
