<?php

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\MemberPlan;
use App\Models\MemberSubscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MemberSubscription>
 */
class MemberSubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->member(),
            'member_plan_id' => MemberPlan::factory(),
            'status' => SubscriptionStatus::Active,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'auto_renew' => true,
            'stripe_subscription_id' => null,
            'stripe_customer_id' => null,
            'canceled_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Active,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
        ]);
    }

    public function pastDue(): static
    {
        return $this->state(fn () => ['status' => SubscriptionStatus::PastDue]);
    }

    public function canceled(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Canceled,
            'canceled_at' => now(),
            'auto_renew' => false,
        ]);
    }

    public function incomplete(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Incomplete,
            'start_date' => null,
            'end_date' => null,
        ]);
    }
}
