<?php

use App\DTO\EligibleTradie;
use App\DTO\ScoringContext;
use App\Services\TradieScorer;

// Helpers ——————————————————————————————————————————————

function tradie(array $overrides = []): EligibleTradie
{
    return new EligibleTradie(
        id: $overrides['id'] ?? 1,
        planDispatchBoost: $overrides['planDispatchBoost'] ?? 0,
        ratingAverage: $overrides['ratingAverage'] ?? null,
        recentAvgResponseSeconds: $overrides['recentAvgResponseSeconds'] ?? null,
        recentOffersCount: $overrides['recentOffersCount'] ?? 0,
        recentAcceptedCount: $overrides['recentAcceptedCount'] ?? 0,
        currentWorkload: $overrides['currentWorkload'] ?? 0,
        disputesLast30Days: $overrides['disputesLast30Days'] ?? 0,
        expiredOffersLast7Days: $overrides['expiredOffersLast7Days'] ?? 0,
    );
}

function ctx(bool $priority = false): ScoringContext
{
    return new ScoringContext(memberPriorityDispatch: $priority);
}

// ——————————————————————————————————————————————————————

$scorer = fn () => new TradieScorer;

it('gives premium tradie a +100 plan boost', function () use ($scorer) {
    $standard = $scorer()->score(ctx(), tradie(['planDispatchBoost' => 0]));
    $premium = $scorer()->score(ctx(), tradie(['planDispatchBoost' => 100]));

    expect($premium - $standard)->toBe(100.0);
});

it('uses default 4.0 rating when tradie has no reviews', function () use ($scorer) {
    $unrated = $scorer()->score(ctx(), tradie(['ratingAverage' => null]));
    $rated = $scorer()->score(ctx(), tradie(['ratingAverage' => 4.0]));

    expect($unrated)->toBe($rated);
});

it('gives higher score for higher rating', function () use ($scorer) {
    $low = $scorer()->score(ctx(), tradie(['ratingAverage' => 3.0]));
    $high = $scorer()->score(ctx(), tradie(['ratingAverage' => 5.0]));

    expect($high)->toBeGreaterThan($low);
    expect($high - $low)->toBe(20.0); // (5-3) * 10
});

it('gives neutral response time points when no data', function () use ($scorer) {
    $neutral = config('dispatch.scoring.neutral_response_time_points');
    $noData = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => null]));
    $base = $scorer()->score(ctx(), tradie(['ratingAverage' => 4.0, 'recentAcceptedCount' => 0]));

    expect($noData - $base)->toBe(0.0); // same baseline
    // Explicitly: no data scores neutral_response_time_points not max
    $fastScore = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => 0]));
    $noDataScore = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => null]));
    expect($fastScore)->toBeGreaterThan($noDataScore);
});

it('gives max response time points for instant response', function () use ($scorer) {
    $max = config('dispatch.scoring.response_time_max_points');
    $base = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => null]));
    $instant = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => 0]));

    expect($instant - $base)->toBe((float) ($max - config('dispatch.scoring.neutral_response_time_points')));
});

it('gives zero response time bonus at 30 minutes', function () use ($scorer) {
    $thirtyMin = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => 1800]));
    $noResponse = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => null]));

    // 30 min → 0 points, neutral → 15 points, so no-response is better
    expect($noResponse)->toBeGreaterThan($thirtyMin);
});

it('clamps response time points at zero below zero', function () use ($scorer) {
    $slow = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => 9000])); // 150 min
    $slower = $scorer()->score(ctx(), tradie(['recentAvgResponseSeconds' => 18000])); // 300 min

    expect($slow)->toBe($slower); // both clamped to 0
});

it('gives neutral acceptance points when fewer than 5 offers', function () use ($scorer) {
    $neutral = config('dispatch.scoring.neutral_acceptance_points');
    $s1 = $scorer()->score(ctx(), tradie(['recentOffersCount' => 4, 'recentAcceptedCount' => 4]));
    $s2 = $scorer()->score(ctx(), tradie(['recentOffersCount' => 0, 'recentAcceptedCount' => 0]));

    expect($s1)->toBe($s2); // both get neutral
});

it('rewards high acceptance rate when 5+ offers', function () use ($scorer) {
    $max = config('dispatch.scoring.acceptance_rate_weight');
    $s100 = $scorer()->score(ctx(), tradie(['recentOffersCount' => 10, 'recentAcceptedCount' => 10]));
    $s50 = $scorer()->score(ctx(), tradie(['recentOffersCount' => 10, 'recentAcceptedCount' => 5]));

    expect($s100 - $s50)->toBe((float) ($max / 2));
});

it('penalises workload', function () use ($scorer) {
    $penalty = config('dispatch.scoring.workload_penalty_per_job');
    $s0 = $scorer()->score(ctx(), tradie(['currentWorkload' => 0]));
    $s3 = $scorer()->score(ctx(), tradie(['currentWorkload' => 3]));

    expect($s0 - $s3)->toBe((float) (3 * $penalty));
});

it('caps workload penalty at the configured cap', function () use ($scorer) {
    $cap = config('dispatch.scoring.workload_penalty_cap');
    $penalty = config('dispatch.scoring.workload_penalty_per_job');
    $sCap = $scorer()->score(ctx(), tradie(['currentWorkload' => $cap]));
    $sOver = $scorer()->score(ctx(), tradie(['currentWorkload' => $cap + 5]));

    expect($sCap)->toBe($sOver);
    $s0 = $scorer()->score(ctx(), tradie(['currentWorkload' => 0]));
    expect($s0 - $sCap)->toBe((float) ($cap * $penalty));
});

it('adds member priority bonus when member is pro/investor', function () use ($scorer) {
    $bonus = config('dispatch.scoring.member_priority_bonus');
    $normal = $scorer()->score(ctx(false), tradie());
    $priority = $scorer()->score(ctx(true), tradie());

    expect($priority - $normal)->toBe((float) $bonus);
});

it('penalises disputes', function () use ($scorer) {
    $penalty = config('dispatch.scoring.dispute_penalty');
    $s0 = $scorer()->score(ctx(), tradie(['disputesLast30Days' => 0]));
    $s2 = $scorer()->score(ctx(), tradie(['disputesLast30Days' => 2]));

    expect($s0 - $s2)->toBe((float) (2 * $penalty));
});

it('penalises expired offers', function () use ($scorer) {
    $penalty = config('dispatch.scoring.expiry_penalty');
    $s0 = $scorer()->score(ctx(), tradie(['expiredOffersLast7Days' => 0]));
    $s3 = $scorer()->score(ctx(), tradie(['expiredOffersLast7Days' => 3]));

    expect($s0 - $s3)->toBe((float) (3 * $penalty));
});

it('ranks premium tradie above standard tradie with equal other factors', function () use ($scorer) {
    $premium = $scorer()->score(ctx(), tradie(['planDispatchBoost' => 100]));
    $standard = $scorer()->score(ctx(), tradie(['planDispatchBoost' => 0]));

    expect($premium)->toBeGreaterThan($standard);
});

it('example from docs: tradie A scores higher than tradie B', function () use ($scorer) {
    // Tradie A: Premium, great stats
    $tradieA = tradie([
        'planDispatchBoost' => 100,
        'ratingAverage' => 4.8,
        'recentAvgResponseSeconds' => 85,
        'recentOffersCount' => 30,
        'recentAcceptedCount' => 22,
        'currentWorkload' => 3,
        'disputesLast30Days' => 0,
        'expiredOffersLast7Days' => 1,
    ]);

    // Tradie B: Standard, new
    $tradieB = tradie([
        'planDispatchBoost' => 0,
        'ratingAverage' => null,
        'recentAvgResponseSeconds' => null,
        'recentOffersCount' => 2,
        'recentAcceptedCount' => 1,
        'currentWorkload' => 0,
        'disputesLast30Days' => 0,
        'expiredOffersLast7Days' => 0,
    ]);

    $scoreA = $scorer()->score(ctx(true), $tradieA);
    $scoreB = $scorer()->score(ctx(true), $tradieB);

    expect($scoreA)->toBeGreaterThan($scoreB);
    // Approximately matches docs example (~176 vs ~70)
    expect($scoreA)->toBeGreaterThan(150.0);
    expect($scoreB)->toBeLessThan(100.0);
});

it('heavily disputed tradie ranks below a clean new tradie', function () use ($scorer) {
    // 4 disputes × 30 = -120 penalty. Premium + perfect rating advantage = +110. Net: -10.
    $disputed = $scorer()->score(ctx(), tradie([
        'planDispatchBoost' => 100,
        'ratingAverage' => 5.0,
        'disputesLast30Days' => 4,
    ]));
    $clean = $scorer()->score(ctx(), tradie([
        'planDispatchBoost' => 0,
        'ratingAverage' => null,
    ]));

    expect($disputed)->toBeLessThan($clean);
});

it('returns a float', function () use ($scorer) {
    $score = $scorer()->score(ctx(), tradie());
    expect($score)->toBeFloat();
});
