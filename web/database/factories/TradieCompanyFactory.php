<?php

namespace Database\Factories;

use App\Enums\TradieCompanyStatus;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\TradieSubscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradieCompany>
 */
class TradieCompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'owner_user_id' => User::factory()->tradie(),
            'business_name' => fake()->company(),
            'trading_name' => null,
            'abn' => null,
            'licence_number' => null,
            'licence_state' => null,
            'licence_expires_on' => null,
            'insurance_expires_on' => null,
            'licence_document_path' => null,
            'insurance_document_path' => null,
            'about_text' => null,
            'logo_path' => null,
            'rating_average' => null,
            'rating_count' => 0,
            'status' => TradieCompanyStatus::PendingReview,
            'approved_at' => null,
            'approved_by_user_id' => null,
            'suspended_reason' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => TradieCompanyStatus::Approved,
            'approved_at' => now(),
            'licence_expires_on' => now()->addYear()->toDateString(),
            'insurance_expires_on' => now()->addYear()->toDateString(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn () => [
            'status' => TradieCompanyStatus::Suspended,
            'suspended_reason' => 'Account suspended pending review.',
        ]);
    }

    public function withRating(float $average, int $count = 10): static
    {
        return $this->state(fn () => [
            'rating_average' => $average,
            'rating_count' => $count,
        ]);
    }

    public function withPlan(TradiePlan $plan): static
    {
        return $this->afterCreating(function (TradieCompany $company) use ($plan): void {
            TradieSubscription::factory()
                ->for($company, 'company')
                ->state(['tradie_plan_id' => $plan->id])
                ->active()
                ->create();
        });
    }
}
