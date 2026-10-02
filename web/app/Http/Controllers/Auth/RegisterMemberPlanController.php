<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Demo\ActivateSubscriptionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Demo\ActivateMemberSubscriptionRequest;
use App\Models\MemberPlan;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisterMemberPlanController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Register/MemberPlan', [
            'plans' => MemberPlan::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'slug', 'name', 'yearly_price_cents', 'max_properties',
                    'includes_discount', 'discount_percent', 'priority_dispatch', 'stripe_price_id']),
        ]);
    }

    public function store(ActivateMemberSubscriptionRequest $request, ActivateSubscriptionAction $action): RedirectResponse
    {
        $action->execute($request->user(), MemberPlan::findOrFail($request->validated('plan_id')));

        return redirect()->route('membership.success');
    }
}
