<?php

namespace App\Services;

use App\Enums\JobStatus;
use App\Exceptions\Job\InvalidStatusTransitionException;

final class JobStatusTransition
{
    private const ALLOWED = [
        'pending_dispatch' => ['offered', 'cancelled'],
        'offered' => ['assigned', 'pending_dispatch', 'cancelled'],
        'assigned' => ['tradie_on_the_way', 'in_progress', 'cancelled', 'rescheduled'],
        'tradie_on_the_way' => ['in_progress', 'cancelled', 'rescheduled'],
        'in_progress' => ['completed', 'cancelled', 'awaiting_client_response'],
        'awaiting_client_response' => ['in_progress', 'completed', 'cancelled'],
        'rescheduled' => ['assigned', 'cancelled'],
        'completed' => ['confirmed', 'disputed'],
        'disputed' => ['confirmed', 'cancelled', 'assigned'],
        'confirmed' => [],
        'cancelled' => [],
    ];

    public function assertAllowed(JobStatus $from, JobStatus $to): void
    {
        $allowed = self::ALLOWED[$from->value] ?? [];

        if (! in_array($to->value, $allowed, strict: true)) {
            throw new InvalidStatusTransitionException(
                "Cannot transition job from [{$from->value}] to [{$to->value}]."
            );
        }
    }
}
