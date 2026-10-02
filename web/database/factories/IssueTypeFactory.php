<?php

namespace Database\Factories;

use App\Models\IssueType;
use App\Models\TradieCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<IssueType>
 */
class IssueTypeFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'tradie_category_id' => TradieCategory::factory(),
            'slug' => Str::slug($name),
            'name' => ucfirst($name),
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
