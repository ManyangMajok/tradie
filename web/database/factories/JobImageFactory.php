<?php

namespace Database\Factories;

use App\Models\Job;
use App\Models\JobImage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobImage>
 */
class JobImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'job_id' => Job::factory(),
            'uploaded_by_user_id' => User::factory()->member(),
            'path' => 'jobs/images/'.fake()->uuid().'.jpg',
            'mime' => 'image/jpeg',
            'size_bytes' => fake()->numberBetween(50000, 5000000),
            'caption' => null,
        ];
    }
}
