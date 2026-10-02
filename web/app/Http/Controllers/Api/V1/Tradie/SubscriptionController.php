<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * GET /api/v1/tradie/subscription
     *
     * Placeholder: reads subscription from DB.
     * No Stripe integration — dev seeder pre-creates active subscriptions.
     * On production, swap to read from Stripe via Cashier.
     */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $subscription = $company->subscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        if (! $subscription) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'status' => $subscription->status->value,
                'plan_name' => $subscription->plan->name,
                'plan_slug' => $subscription->plan->slug,
                'yearly_price_cents' => $subscription->plan->yearly_price_cents,
                'dispatch_rank_boost' => $subscription->plan->dispatch_rank_boost,
                'featured_listing' => $subscription->plan->featured_listing,
                'start_date' => $subscription->start_date?->toDateString(),
                'end_date' => $subscription->end_date?->toDateString(),
                'auto_renew' => $subscription->auto_renew,
            ],
        ]);
    }
}
