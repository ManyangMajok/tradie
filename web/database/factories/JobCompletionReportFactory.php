<?php

namespace Database\Factories;

use App\Models\Job;
use App\Models\JobCompletionReport;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobCompletionReport>
 */
class JobCompletionReportFactory extends Factory
{
    public function definition(): array
    {
        $discountApplied = fake()->boolean(60);

        return [
            'job_id' => Job::factory(),
            'tradie_company_id' => TradieCompany::factory()->approved(),
            'submitted_by_user_id' => User::factory()->tradie(),
            'summary_of_work' => fake()->paragraph(),
            'invoice_total_cents' => fake()->numberBetween(10000, 500000),
            'no_callout_fee_confirmed' => true,
            'discount_applied' => $discountApplied,
            'discount_amount_cents' => $discountApplied ? fake()->numberBetween(1000, 10000) : null,
            'invoice_document_path' => null,
            'completion_notes' => null,
            'submitted_at' => now(),
        ];
    }

    public function withDiscount(int $discountCents): static
    {
        return $this->state(fn () => [
            'discount_applied' => true,
            'discount_amount_cents' => $discountCents,
        ]);
    }
}
