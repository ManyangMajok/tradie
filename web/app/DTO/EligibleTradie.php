<?php

namespace App\DTO;

final class EligibleTradie
{
    public function __construct(
        public readonly int $id,
        public readonly float $planDispatchBoost,
        public readonly ?float $ratingAverage,
        public readonly ?float $recentAvgResponseSeconds,
        public readonly int $recentOffersCount,
        public readonly int $recentAcceptedCount,
        public readonly int $currentWorkload,
        public readonly int $disputesLast30Days,
        public readonly int $expiredOffersLast7Days,
    ) {}
}
