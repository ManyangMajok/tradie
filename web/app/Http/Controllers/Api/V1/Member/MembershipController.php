<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    /**
     * GET /api/v1/member/membership
     *
     * Placeholder: reads subscription from DB.
     * No Stripe integration for local testing.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $subscription = $user->memberSubscriptions()
            ->with('plan')
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->latest()
            ->first();

        if (! $subscription) {
            return response()->json([
                'membership' => null,
                'message' => 'No active membership.',
            ]);
        }

        return response()->json([
            'membership' => [
                'status' => $subscription->status->value,
                'plan' => [
                    'name' => $subscription->plan->name,
                    'yearly_price_cents' => $subscription->plan->yearly_price_cents,
                    'max_properties' => $subscription->plan->max_properties,
                    'dispatch_priority' => $subscription->plan->dispatch_priority,
                ],
                'start_date' => $subscription->start_date?->toDateString(),
                'end_date' => $subscription->end_date?->toDateString(),
                'auto_renew' => $subscription->auto_renew,
            ],
        ]);
    }
}
