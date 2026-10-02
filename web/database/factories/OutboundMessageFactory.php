<?php

namespace Database\Factories;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Models\OutboundMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OutboundMessage>
 */
class OutboundMessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'channel' => fake()->randomElement(NotificationChannel::cases()),
            'template_key' => fake()->randomElement([
                'lead_offer_sms',
                'lead_offer_email',
                'job_assigned_member',
                'job_completed_member',
            ]),
            'recipient' => fake()->email(),
            'subject' => fake()->sentence(),
            'body' => fake()->paragraph(),
            'context' => null,
            'related_type' => null,
            'related_id' => null,
            'provider_message_id' => null,
            'status' => NotificationStatus::Sent,
            'error_message' => null,
            'sent_at' => now(),
            'delivered_at' => null,
            'failed_at' => null,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => NotificationStatus::Failed,
            'error_message' => 'Delivery failed: invalid recipient.',
            'sent_at' => null,
            'failed_at' => now(),
        ]);
    }
}
