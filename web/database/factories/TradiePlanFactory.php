<?php

namespace Database\Factories;

use App\Models\TradiePlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TradiePlan>
 */
class TradiePlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'slug' => Str::slug(fake()->unique()->word()),
            'name' => fake()->words(2, true),
            'yearly_price_cents' => fake()->numberBetween(29900, 99900),
            'dispatch_rank_boost' => 0,
            'featured_listing' => false,
            'suburb_exclusivity' => false,
            'stripe_price_id' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function standard(): static
    {
        return $this->state(fn () => [
            'slug' => 'standard',
            'name' => 'Standard',
            'dispatch_rank_boost' => 0,
            'featured_listing' => false,
        ]);
    }

    public function premium(): static
    {
        return $this->state(fn () => [
            'slug' => 'premium',
            'name' => 'Premium',
            'dispatch_rank_boost' => 100,
            'featured_listing' => true,
        ]);
    }
}
