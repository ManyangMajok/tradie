<?php

namespace App\Http\Controllers\Member;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\MemberPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        $subscription = $user->memberSubscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        return Inertia::render('Member/Membership', [
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status->value,
                'plan' => [
                    'name' => $subscription->plan->name,
                    'yearly_price_cents' => $subscription->plan->yearly_price_cents,
                ],
                'start_date' => $subscription->start_date?->toDateString(),
                'end_date' => $subscription->end_date?->toDateString(),
                'auto_renew' => $subscription->auto_renew,
                'canceled_at' => $subscription->canceled_at?->toIso8601String(),
            ] : null,
            'plans' => MemberPlan::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'slug', 'name', 'yearly_price_cents', 'max_properties',
                    'includes_discount', 'discount_percent', 'priority_dispatch']),
        ]);
    }

    public function success(Request $request): RedirectResponse
    {
        return redirect()->route('member.dashboard')
            ->with('success', 'Demo payment successful. Your membership is now active.');
    }

    public function portal(Request $request): RedirectResponse
    {
        return redirect()->route('membership')->with('success', 'Demo billing: no card details or real charges are required.');
    }

    public function cancel(Request $request): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user) {
            User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $subscription = $user->memberSubscriptions()
                ->where('status', SubscriptionStatus::Active->value)->lockForUpdate()->latest()->first();
            $subscription?->update(['auto_renew' => false, 'canceled_at' => now()]);
        });

        return back()->with('success', 'Your membership will continue until the end of the current billing period.');
    }
}
