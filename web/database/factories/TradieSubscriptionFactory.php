<?php

namespace Database\Factories;

use App\Enums\SubscriptionStatus;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\TradieSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradieSubscription>
 */
class TradieSubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tradie_company_id' => TradieCompany::factory(),
            'tradie_plan_id' => TradiePlan::factory(),
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
}
