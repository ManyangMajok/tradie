<?php

namespace Database\Factories;

use App\Enums\JobStatus;
use App\Enums\Urgency;
use App\Models\Job;
use App\Models\Property;
use App\Models\TradieCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Job>
 */
class JobFactory extends Factory
{
    public function definition(): array
    {
        return [
            'member_user_id' => User::factory()->member(),
            'property_id' => Property::factory(),
            'tradie_category_id' => TradieCategory::factory(),
            'issue_type_id' => null,
            'custom_issue' => fake()->sentence(4),
            'urgency' => fake()->randomElement(Urgency::cases()),
            'description' => fake()->paragraph(),
            'best_contact_time' => fake()->randomElement(['any', 'mornings', 'afternoons', 'evenings']),
            'status' => JobStatus::PendingDispatch,
            'submitted_at' => now(),
            'dispatched_at' => null,
            'assigned_tradie_company_id' => null,
            'assigned_at' => null,
            'on_the_way_at' => null,
            'started_at' => null,
            'completed_at' => null,
            'confirmed_at' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
            'dispatch_round' => 0,
            'requires_admin_review' => false,
        ];
    }

    public function pendingDispatch(): static
    {
        return $this->state(fn () => ['status' => JobStatus::PendingDispatch]);
    }

    public function assigned(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Assigned,
            'dispatched_at' => now()->subMinutes(5),
            'assigned_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Completed,
            'dispatched_at' => now()->subDay(),
            'assigned_at' => now()->subDay(),
            'started_at' => now()->subHours(4),
            'completed_at' => now()->subHour(),
        ]);
    }

    public function disputed(): static
    {
        return $this->state(fn () => [
            'status' => JobStatus::Disputed,
            'requires_admin_review' => true,
        ]);
    }

    public function emergency(): static
    {
        return $this->state(fn () => ['urgency' => Urgency::Emergency]);
    }
}
