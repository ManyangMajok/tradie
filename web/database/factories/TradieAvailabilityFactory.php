<?php

namespace Database\Factories;

use App\Models\TradieAvailability;
use App\Models\TradieCompany;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradieAvailability>
 */
class TradieAvailabilityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tradie_company_id' => TradieCompany::factory(),
            'day_of_week' => fake()->numberBetween(0, 6),
            'opens_at' => '08:00:00',
            'closes_at' => '17:00:00',
            'accepts_emergency' => false,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'opens_at' => null,
            'closes_at' => null,
        ]);
    }

    public function acceptsEmergency(): static
    {
        return $this->state(fn () => ['accepts_emergency' => true]);
    }
}
