<?php

namespace App\DTO;

use App\Enums\SubscriptionStatus;
use App\Models\Job;

final class ScoringContext
{
    public function __construct(
        public readonly bool $memberPriorityDispatch = false,
    ) {}

    public static function forJob(Job $job): self
    {
        // Pro and Investor members get a +5 priority bonus in scoring.
        $subscription = $job->member
            ->memberSubscriptions()
            ->where('status', SubscriptionStatus::Active)
            ->with('plan')
            ->latest()
            ->first();

        return new self(
            memberPriorityDispatch: $subscription?->plan?->priority_dispatch ?? false,
        );
    }
}
