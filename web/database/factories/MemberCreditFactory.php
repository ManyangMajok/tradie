<?php

namespace Database\Factories;

use App\Models\MemberCredit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MemberCredit>
 */
class MemberCreditFactory extends Factory
{
    public function definition(): array
    {
        return [
            'member_user_id' => User::factory()->member(),
            'amount_cents' => fake()->numberBetween(500, 10000),
            'reason' => fake()->sentence(),
            'created_by_user_id' => User::factory()->admin(),
            'applied_to_subscription_id' => null,
            'expires_at' => now()->addYear(),
        ];
    }
}
