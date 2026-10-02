<?php

namespace Database\Factories;

use App\Models\TradieCompany;
use App\Models\TradiePerformanceDaily;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TradiePerformanceDaily>
 */
class TradiePerformanceDailyFactory extends Factory
{
    public function definition(): array
    {
        $offered = fake()->numberBetween(0, 10);
        $accepted = fake()->numberBetween(0, $offered);
        $declined = fake()->numberBetween(0, $offered - $accepted);
        $expired = $offered - $accepted - $declined;

        return [
            'tradie_company_id' => TradieCompany::factory()->approved(),
            'date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'leads_offered' => $offered,
            'leads_viewed' => fake()->numberBetween($accepted, $offered),
            'leads_accepted' => $accepted,
            'leads_declined' => $declined,
            'leads_expired' => $expired,
            'jobs_completed' => fake()->numberBetween(0, $accepted),
            'jobs_disputed' => 0,
            'avg_response_time_seconds' => $accepted > 0 ? fake()->numberBetween(60, 3600) : null,
            'reported_revenue_cents' => fake()->numberBetween(0, 500000),
            'discount_given_cents' => fake()->numberBetween(0, 10000),
        ];
    }
}
