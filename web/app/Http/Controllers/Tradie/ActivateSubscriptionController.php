<?php

namespace App\Http\Controllers\Tradie;

use App\Actions\Demo\ActivateSubscriptionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Demo\ActivateTradieSubscriptionRequest;
use App\Models\TradiePlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivateSubscriptionController extends Controller
{
    public function show(Request $request): Response
    {
        $plans = TradiePlan::active()
            ->get(['id', 'slug', 'name', 'yearly_price_cents', 'dispatch_rank_boost',
                'featured_listing', 'stripe_price_id']);

        return Inertia::render('Tradie/ActivateSubscription', ['plans' => $plans]);
    }

    public function store(ActivateTradieSubscriptionRequest $request, ActivateSubscriptionAction $action): RedirectResponse
    {
        $action->execute($request->user()->tradieCompany, TradiePlan::findOrFail($request->validated('plan_id')));

        return redirect()->route('tradie.subscription.success');
    }

    public function success(Request $request): RedirectResponse
    {
        return redirect()->route('tradie.leads')
            ->with('success', 'Demo payment successful. Your subscription is active. You\'ll start receiving leads shortly.');
    }
}
