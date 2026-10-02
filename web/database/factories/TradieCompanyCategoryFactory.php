<?php

namespace Database\Factories;

use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradieCompanyCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradieCompanyCategory>
 */
class TradieCompanyCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tradie_company_id' => TradieCompany::factory(),
            'tradie_category_id' => TradieCategory::factory(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
