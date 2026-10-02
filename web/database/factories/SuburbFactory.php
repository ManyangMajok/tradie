<?php

namespace Database\Factories;

use App\Models\Suburb;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Suburb>
 */
class SuburbFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->city(),
            'postcode' => fake()->numerify('####'),
            'state' => fake()->randomElement(['WA', 'NSW', 'VIC', 'QLD', 'SA']),
            'latitude' => fake()->latitude(-38, -22),
            'longitude' => fake()->longitude(114, 154),
            'is_active' => true,
        ];
    }

    public function wa(): static
    {
        return $this->state(fn () => [
            'state' => 'WA',
            'latitude' => fake()->latitude(-35, -22),
            'longitude' => fake()->longitude(114, 129),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
