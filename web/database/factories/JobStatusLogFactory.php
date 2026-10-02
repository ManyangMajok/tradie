<?php

namespace Database\Factories;

use App\Enums\JobStatus;
use App\Models\Job;
use App\Models\JobStatusLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobStatusLog>
 */
class JobStatusLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'job_id' => Job::factory(),
            'from_status' => null,
            'to_status' => JobStatus::PendingDispatch,
            'changed_by_user_id' => null,
            'changed_by_system' => true,
            'note' => null,
        ];
    }

    public function bySystem(JobStatus $to, ?JobStatus $from = null): static
    {
        return $this->state(fn () => [
            'from_status' => $from,
            'to_status' => $to,
            'changed_by_user_id' => null,
            'changed_by_system' => true,
        ]);
    }
}
