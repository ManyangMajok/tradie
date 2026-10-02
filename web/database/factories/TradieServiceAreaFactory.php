<?php

namespace Database\Factories;

use App\Models\Suburb;
use App\Models\TradieCompany;
use App\Models\TradieServiceArea;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradieServiceArea>
 */
class TradieServiceAreaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tradie_company_id' => TradieCompany::factory(),
            'suburb_id' => Suburb::factory(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
