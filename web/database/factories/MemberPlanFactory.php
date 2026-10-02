<?php

namespace Database\Factories;

use App\Models\MemberPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MemberPlan>
 */
class MemberPlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'slug' => Str::slug(fake()->unique()->word()),
            'name' => fake()->words(2, true),
            'yearly_price_cents' => fake()->numberBetween(9900, 49900),
            'max_properties' => 1,
            'includes_discount' => true,
            'discount_percent' => 10,
            'priority_dispatch' => false,
            'stripe_price_id' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function basic(): static
    {
        return $this->state(fn () => [
            'slug' => 'basic',
            'name' => 'Basic',
            'max_properties' => 1,
            'priority_dispatch' => false,
        ]);
    }

    public function pro(): static
    {
        return $this->state(fn () => [
            'slug' => 'pro',
            'name' => 'Pro',
            'max_properties' => 3,
            'priority_dispatch' => true,
        ]);
    }

    public function investor(): static
    {
        return $this->state(fn () => [
            'slug' => 'investor',
            'name' => 'Investor',
            'max_properties' => null,
            'priority_dispatch' => true,
        ]);
    }
}
