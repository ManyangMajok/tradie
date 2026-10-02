<?php

return [

    'mode' => env('DISPATCH_MODE', 'sequential'), // 'sequential' | 'parallel'

    'offers_per_round' => 3,
    'max_rounds' => 2,

    'windows_seconds' => [
        'emergency' => 120,    //  2 min
        'same_day' => 900,    // 15 min
        'within_48h' => 1800,   // 30 min
        'flexible' => 3600,   // 60 min
    ],

    'scoring' => [
        'rating_weight' => 10,
        'default_rating_for_unrated' => 4.0,
        'response_time_max_points' => 30,
        'response_time_max_minutes' => 30,
        'neutral_response_time_points' => 15,
        'acceptance_rate_weight' => 20,
        'acceptance_min_offers' => 5,
        'neutral_acceptance_points' => 10,
        'workload_penalty_per_job' => 2,
        'workload_penalty_cap' => 10,
        'member_priority_bonus' => 5,
        'dispute_penalty' => 30,
        'expiry_penalty' => 15,
        'dispute_lookback_days' => 30,
        'expiry_lookback_days' => 7,
    ],

    'past_due_grace_days' => 3,

    'duplicate_submission_seconds' => 60,

    'version' => 1,

];
