<?php

namespace Database\Factories;

use App\Models\TradieCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TradieCategory>
 */
class TradieCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Plumber', 'Electrician', 'Carpenter', 'Painter',
            'Landscaper', 'Tiler', 'Concreter', 'Roofer',
        ]);

        return [
            'slug' => Str::slug($name),
            'name' => $name,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
