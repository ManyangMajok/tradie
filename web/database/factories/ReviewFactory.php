<?php

namespace Database\Factories;

use App\Models\Job;
use App\Models\Review;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'job_id' => Job::factory(),
            'member_user_id' => User::factory()->member(),
            'tradie_company_id' => TradieCompany::factory()->approved(),
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => fake()->numberBetween(4, 5),
            'review_text' => fake()->optional(0.6)->paragraph(),
            'was_auto_confirmed' => false,
            'submitted_at' => now(),
        ];
    }

    public function positive(): static
    {
        return $this->state(fn () => [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => fake()->numberBetween(4, 5),
        ]);
    }

    public function disputed(): static
    {
        return $this->state(fn () => [
            'work_completed_status' => fake()->randomElement(['partial', 'no']),
            'no_callout_fee_honoured' => false,
            'discount_honoured' => 'no',
            'stars' => fake()->numberBetween(1, 2),
        ]);
    }

    public function autoConfirmed(): static
    {
        return $this->state(fn () => [
            'was_auto_confirmed' => true,
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'na',
            'stars' => 5,
            'review_text' => null,
        ]);
    }
}
