<?php

namespace App\Actions\Demo;

use App\Enums\SubscriptionStatus;
use App\Enums\UserStatus;
use App\Models\MemberPlan;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ActivateSubscriptionAction
{
    public function execute(User|TradieCompany $owner, MemberPlan|TradiePlan $plan): void
    {
        DB::transaction(function () use ($owner, $plan) {
            // Lock the owner even before the first subscription exists, so double clicks cannot create two.
            $owner = $owner->newQuery()->lockForUpdate()->findOrFail($owner->getKey());
            $subscriptions = $owner instanceof User ? $owner->memberSubscriptions() : $owner->subscriptions();
            $planKey = $owner instanceof User ? 'member_plan_id' : 'tradie_plan_id';
            $current = $subscriptions->whereIn('status', ['active', 'past_due'])->first();
            if ($current) {
                if ($current->{$planKey} !== $plan->id) {
                    throw ValidationException::withMessages([
                        'plan_id' => 'You already have a subscription. Plan changes are not simulated in this demo.',
                    ]);
                }

                return;
            }
            $subscriptions->create([
                $planKey => $plan->id,
                'status' => SubscriptionStatus::Active,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                'auto_renew' => true,
            ]);
            if ($owner instanceof User) {
                $owner->update(['status' => UserStatus::Active]);
            }
        });
    }
}
