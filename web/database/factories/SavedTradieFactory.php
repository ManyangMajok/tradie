<?php

namespace Database\Factories;

use App\Models\SavedTradie;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SavedTradie>
 */
class SavedTradieFactory extends Factory
{
    public function definition(): array
    {
        return [
            'member_user_id' => User::factory()->member(),
            'tradie_company_id' => TradieCompany::factory()->approved(),
        ];
    }
}
