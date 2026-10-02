<?php

namespace Database\Factories;

use App\Enums\OfferStatus;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\TradieCompany;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobOffer>
 */
class JobOfferFactory extends Factory
{
    public function definition(): array
    {
        $offeredAt = now()->subMinutes(fake()->numberBetween(1, 60));

        return [
            'job_id' => Job::factory(),
            'tradie_company_id' => TradieCompany::factory()->approved(),
            'round' => 1,
            'rank_in_round' => 1,
            'score' => fake()->randomFloat(4, 50, 500),
            'status' => OfferStatus::Offered,
            'offered_at' => $offeredAt,
            'viewed_at' => null,
            'accepted_at' => null,
            'declined_at' => null,
            'declined_reason' => null,
            'expired_at' => null,
            'expires_at' => $offeredAt->copy()->addHours(2),
            'superseded_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => OfferStatus::Pending,
            'offered_at' => null,
            'expires_at' => now()->addHours(2),
        ]);
    }

    public function offered(): static
    {
        return $this->state(fn () => ['status' => OfferStatus::Offered]);
    }

    public function accepted(): static
    {
        return $this->state(function () {
            $offeredAt = now()->subHour();
            $acceptedAt = $offeredAt->copy()->addMinutes(fake()->numberBetween(5, 55));

            return [
                'status' => OfferStatus::Accepted,
                'offered_at' => $offeredAt,
                'viewed_at' => $offeredAt->copy()->addMinutes(2),
                'accepted_at' => $acceptedAt,
                'expires_at' => $offeredAt->copy()->addHours(2),
            ];
        });
    }

    public function declined(): static
    {
        return $this->state(fn () => [
            'status' => OfferStatus::Declined,
            'declined_at' => now(),
            'declined_reason' => fake()->randomElement(['too_far', 'busy', 'not_my_work', 'other']),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => OfferStatus::Expired,
            'offered_at' => now()->subHours(3),
            'expires_at' => now()->subHour(),
            'expired_at' => now()->subHour(),
        ]);
    }

    public function superseded(): static
    {
        return $this->state(fn () => [
            'status' => OfferStatus::Superseded,
            'superseded_at' => now(),
        ]);
    }
}
