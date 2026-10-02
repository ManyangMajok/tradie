<?php

use App\Actions\Dispatch\AcceptOfferAction;
use App\Actions\Dispatch\DeclineOfferAction;
use App\Actions\Dispatch\DispatchJobAction;
use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Exceptions\Dispatch\OfferExpiredException;
use App\Exceptions\Dispatch\OfferNoLongerAvailableException;
use App\Jobs\Dispatch\AdvanceToNextRank;
use App\Jobs\Dispatch\ExpireOffer;
use App\Jobs\Dispatch\SendLeadNotification;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\Property;
use App\Models\TradieAvailability;
use App\Models\TradieCompany;
use App\Models\TradieCompanyCategory;
use App\Models\TradiePlan;
use App\Models\TradieServiceArea;
use App\Models\TradieSubscription;
use App\Models\User;
use App\Services\EligibleTradieQuery;
use App\Services\TradieScorer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a TradieCompany that is fully eligible for the given Job.
 * Availability is set to cover all 7 days, 00:00–23:59, to avoid time-of-day flakiness.
 */
function makeEligibleTradie(Job $job, array $companyOverrides = []): TradieCompany
{
    // Use a plain plan (no fixed slug) to avoid unique-constraint errors when called multiple times per test
    $plan = TradiePlan::factory()->create();
    $company = TradieCompany::factory()->approved()->create($companyOverrides);

    TradieSubscription::factory()
        ->for($company, 'company')
        ->state(['tradie_plan_id' => $plan->id])
        ->active()
        ->create();

    TradieCompanyCategory::factory()->create([
        'tradie_company_id' => $company->id,
        'tradie_category_id' => $job->tradie_category_id,
        'is_active' => true,
    ]);

    TradieServiceArea::factory()->create([
        'tradie_company_id' => $company->id,
        'suburb_id' => $job->property->suburb_id,
        'is_active' => true,
    ]);

    // Cover every day of the week, all hours
    foreach (range(0, 6) as $dow) {
        TradieAvailability::factory()->create([
            'tradie_company_id' => $company->id,
            'day_of_week' => $dow,
            'opens_at' => '00:00:00',
            'closes_at' => '23:59:59',
            'accepts_emergency' => false,
        ]);
    }

    return $company;
}

/**
 * Return the tradie User who owns a TradieCompany.
 */
function ownerOf(TradieCompany $company): User
{
    return User::findOrFail($company->owner_user_id);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

it('submitting a job creates a job_offer and transitions status to offered', function () {
    Queue::fake();

    $job = Job::factory()->pendingDispatch()->create();
    makeEligibleTradie($job);

    $action = app(DispatchJobAction::class);
    $action->execute($job);

    expect($job->fresh()->status)->toBe(JobStatus::Offered);
    expect(JobOffer::where('job_id', $job->id)->count())->toBe(1);

    $offer = JobOffer::where('job_id', $job->id)->first();
    expect($offer->round)->toBe(1);
    expect($offer->rank_in_round)->toBe(1);
    expect($offer->status)->toBe(OfferStatus::Offered);
    expect($offer->expires_at)->not->toBeNull();

    Queue::assertPushed(SendLeadNotification::class);
    Queue::assertPushed(ExpireOffer::class);
});

it('accepting an offer transitions job to assigned', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);
    $tradieUser = ownerOf($company);

    $offer = JobOffer::factory()->offered()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'expires_at' => now()->addHour(),
    ]);

    $resultJob = app(AcceptOfferAction::class)->execute($offer, $tradieUser);

    expect($resultJob->status)->toBe(JobStatus::Assigned);
    expect($resultJob->assigned_tradie_company_id)->toBe($company->id);
    expect($resultJob->assigned_at)->not->toBeNull();

    expect($offer->fresh()->status)->toBe(OfferStatus::Accepted);
    expect($offer->fresh()->accepted_at)->not->toBeNull();
});

it('accepting an offer logs the status change', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);
    $tradieUser = ownerOf($company);

    $offer = JobOffer::factory()->offered()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'expires_at' => now()->addHour(),
    ]);

    app(AcceptOfferAction::class)->execute($offer, $tradieUser);

    $this->assertDatabaseHas('job_status_logs', [
        'job_id' => $job->id,
        'from_status' => JobStatus::Offered->value,
        'to_status' => JobStatus::Assigned->value,
        'changed_by_user_id' => $tradieUser->id,
        'changed_by_system' => false,
    ]);
});

it('declining an offer dispatches AdvanceToNextRank', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);
    $tradieUser = ownerOf($company);

    $offer = JobOffer::factory()->offered()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'expires_at' => now()->addHour(),
        'round' => 1,
        'rank_in_round' => 1,
    ]);

    app(DeclineOfferAction::class)->execute($offer, $tradieUser, 'too_far');

    expect($offer->fresh()->status)->toBe(OfferStatus::Declined);
    expect($offer->fresh()->declined_reason)->toBe('too_far');

    Queue::assertPushed(AdvanceToNextRank::class, fn ($job) => $job->jobId === $offer->job_id && $job->round === 1
    );
});

it('offer expiry marks offer expired and dispatches AdvanceToNextRank', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);

    $offer = JobOffer::factory()->offered()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'expires_at' => now()->subMinute(), // already past
        'round' => 1,
        'rank_in_round' => 1,
    ]);

    (new ExpireOffer($offer->id))->handle();

    expect($offer->fresh()->status)->toBe(OfferStatus::Expired);
    expect($offer->fresh()->expired_at)->not->toBeNull();

    Queue::assertPushed(AdvanceToNextRank::class, fn ($job) => $job->jobId === $offer->job_id && $job->round === 1
    );
});

it('advancing after round 1 exhausted creates a round 2 offer', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered, 'dispatch_round' => 1])->create();

    // Round 1 had 3 different tradies (ranks 1–3) — all declined
    $round1Companies = [];
    foreach ([1, 2, 3] as $rank) {
        $c = makeEligibleTradie($job);
        $round1Companies[] = $c;
        JobOffer::factory()->declined()->create([
            'job_id' => $job->id,
            'tradie_company_id' => $c->id,
            'round' => 1,
            'rank_in_round' => $rank,
        ]);
    }

    // A 4th tradie is eligible for round 2 (not offered yet)
    makeEligibleTradie($job);

    // AdvanceToNextRank for round 1, nextRank would be 4 > offers_per_round(3)
    // so it calls DispatchJobAction which starts round 2
    $advanceJob = new AdvanceToNextRank($job->id, 1);
    $advanceJob->handle(
        app(DispatchJobAction::class),
        app(EligibleTradieQuery::class),
        app(TradieScorer::class),
    );

    // A round 2 offer should now exist
    $round2Offer = JobOffer::where('job_id', $job->id)->where('round', 2)->first();
    expect($round2Offer)->not->toBeNull();
    expect($round2Offer->rank_in_round)->toBe(1);
    expect($round2Offer->status)->toBe(OfferStatus::Offered);
});

it('escalates to admin when all rounds are exhausted', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered, 'dispatch_round' => 2])->create();

    // Each offer must use a distinct company to avoid (job_id, tradie_company_id, round) unique violation
    foreach ([1, 2] as $round) {
        foreach ([1, 2, 3] as $rank) {
            $c = makeEligibleTradie($job);
            JobOffer::factory()->declined()->create([
                'job_id' => $job->id,
                'tradie_company_id' => $c->id,
                'round' => $round,
                'rank_in_round' => $rank,
            ]);
        }
    }

    // AdvanceToNextRank for round 2 rank 4 → exhausted → calls DispatchJobAction
    // DispatchJobAction sees targetRound=3 > max_rounds=2 → escalates
    $advanceJob = new AdvanceToNextRank($job->id, 2);
    $advanceJob->handle(
        app(DispatchJobAction::class),
        app(EligibleTradieQuery::class),
        app(TradieScorer::class),
    );

    $freshJob = $job->fresh();
    expect($freshJob->requires_admin_review)->toBeTrue();
    expect($freshJob->status)->toBe(JobStatus::PendingDispatch);
});

it('accepting an already-expired offer throws OfferExpiredException', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);
    $tradieUser = ownerOf($company);

    $offer = JobOffer::factory()->offered()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'expires_at' => now()->subMinute(), // already expired
    ]);

    expect(fn () => app(AcceptOfferAction::class)->execute($offer, $tradieUser))
        ->toThrow(OfferExpiredException::class);
});

it('accepting an already-declined offer throws OfferNoLongerAvailableException', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered])->create();
    $company = makeEligibleTradie($job);
    $tradieUser = ownerOf($company);

    $offer = JobOffer::factory()->declined()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
    ]);

    expect(fn () => app(AcceptOfferAction::class)->execute($offer, $tradieUser))
        ->toThrow(OfferNoLongerAvailableException::class);
});

it('duplicate job submission within 60s returns the existing job', function () {
    Queue::fake();

    $member = User::factory()->member()->create();
    $property = Property::factory()->forMember($member)->create();

    $job = Job::factory()->create([
        'member_user_id' => $member->id,
        'property_id' => $property->id,
        'status' => JobStatus::Offered,
        'submitted_at' => now(),
    ]);

    $company = makeEligibleTradie($job);
    $job->update(['selected_tradie_company_id' => $company->id]);

    $this->actingAs($member)
        ->postJson('/jobs', [
            'selected_tradie_company_id' => $company->id,
            'property_id' => $property->id,
            'tradie_category_id' => $job->tradie_category_id,
            'urgency' => $job->urgency->value,
            'description' => 'Duplicate request',
            'best_contact_time' => 'any',
            'custom_issue' => 'Leaking tap',
        ])
        ->assertStatus(200)
        ->assertJsonPath('public_id', $job->public_id);

    // No second job created
    expect(Job::where('member_user_id', $member->id)->count())->toBe(1);
});

it('dispute-flagged tradie is excluded from dispatch', function () {
    Queue::fake();

    $job = Job::factory()->pendingDispatch()->create();

    // This tradie has requires_admin_review = true on another job → excluded
    $disputedCompany = makeEligibleTradie($job);
    Job::factory()->disputed()->create([
        'assigned_tradie_company_id' => $disputedCompany->id,
    ]);

    // Make a clean tradie too so dispatch doesn't immediately escalate
    $cleanCompany = makeEligibleTradie($job);

    app(DispatchJobAction::class)->execute($job);

    $offer = JobOffer::where('job_id', $job->id)->first();
    expect($offer->tradie_company_id)->toBe($cleanCompany->id);
});

it('emergency job dispatches to tradie with accepts_emergency outside normal hours', function () {
    Queue::fake();

    $job = Job::factory()->emergency()->pendingDispatch()->create();

    // Standard tradie: closed today
    $plan = TradiePlan::factory()->create();
    $closedCompany = TradieCompany::factory()->approved()->create();
    TradieSubscription::factory()->for($closedCompany, 'company')
        ->state(['tradie_plan_id' => $plan->id])->active()->create();
    TradieCompanyCategory::factory()->create([
        'tradie_company_id' => $closedCompany->id,
        'tradie_category_id' => $job->tradie_category_id,
        'is_active' => true,
    ]);
    TradieServiceArea::factory()->create([
        'tradie_company_id' => $closedCompany->id,
        'suburb_id' => $job->property->suburb_id,
        'is_active' => true,
    ]);
    // Closed all week
    foreach (range(0, 6) as $dow) {
        TradieAvailability::factory()->closed()->create([
            'tradie_company_id' => $closedCompany->id,
            'day_of_week' => $dow,
        ]);
    }

    // Emergency tradie: accepts_emergency = true (closed normal hours but emergency flag set)
    $emergencyCompany = TradieCompany::factory()->approved()->create();
    TradieSubscription::factory()->for($emergencyCompany, 'company')
        ->state(['tradie_plan_id' => $plan->id])->active()->create();
    TradieCompanyCategory::factory()->create([
        'tradie_company_id' => $emergencyCompany->id,
        'tradie_category_id' => $job->tradie_category_id,
        'is_active' => true,
    ]);
    TradieServiceArea::factory()->create([
        'tradie_company_id' => $emergencyCompany->id,
        'suburb_id' => $job->property->suburb_id,
        'is_active' => true,
    ]);
    foreach (range(0, 6) as $dow) {
        TradieAvailability::factory()->acceptsEmergency()->create([
            'tradie_company_id' => $emergencyCompany->id,
            'day_of_week' => $dow,
            'opens_at' => null,
            'closes_at' => null,
        ]);
    }

    app(DispatchJobAction::class)->execute($job);

    $offer = JobOffer::where('job_id', $job->id)->first();
    expect($offer)->not->toBeNull();
    expect($offer->tradie_company_id)->toBe($emergencyCompany->id);
});

it('no eligible tradies immediately escalates to admin', function () {
    Queue::fake();

    // Job with no tradies covering its suburb/category
    $job = Job::factory()->pendingDispatch()->create();

    app(DispatchJobAction::class)->execute($job);

    $freshJob = $job->fresh();
    expect($freshJob->requires_admin_review)->toBeTrue();
    expect($freshJob->status)->toBe(JobStatus::PendingDispatch);
    expect(JobOffer::where('job_id', $job->id)->count())->toBe(0);
});

it('past_due tradie within grace period is eligible for dispatch', function () {
    Queue::fake();

    $job = Job::factory()->pendingDispatch()->create();

    $plan = TradiePlan::factory()->create();
    $company = TradieCompany::factory()->approved()->create();

    // past_due but within the 3-day grace window
    TradieSubscription::factory()
        ->for($company, 'company')
        ->pastDue()
        ->state([
            'tradie_plan_id' => $plan->id,
            'end_date' => now()->subDays(1)->toDateString(), // 1 day past due
        ])
        ->create();

    TradieCompanyCategory::factory()->create([
        'tradie_company_id' => $company->id,
        'tradie_category_id' => $job->tradie_category_id,
        'is_active' => true,
    ]);
    TradieServiceArea::factory()->create([
        'tradie_company_id' => $company->id,
        'suburb_id' => $job->property->suburb_id,
        'is_active' => true,
    ]);
    foreach (range(0, 6) as $dow) {
        TradieAvailability::factory()->create([
            'tradie_company_id' => $company->id,
            'day_of_week' => $dow,
            'opens_at' => '00:00:00',
            'closes_at' => '23:59:59',
        ]);
    }

    app(DispatchJobAction::class)->execute($job);

    expect(JobOffer::where('job_id', $job->id)->where('tradie_company_id', $company->id)->exists())->toBeTrue();
});

it('already-offered tradie is excluded when advancing to next rank', function () {
    Queue::fake();

    $job = Job::factory()->state(['status' => JobStatus::Offered, 'dispatch_round' => 1])->create();

    $company1 = makeEligibleTradie($job);
    $company2 = makeEligibleTradie($job);

    // Rank 1 already offered and declined
    JobOffer::factory()->declined()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company1->id,
        'round' => 1,
        'rank_in_round' => 1,
    ]);

    $advanceJob = new AdvanceToNextRank($job->id, 1);
    $advanceJob->handle(
        app(DispatchJobAction::class),
        app(EligibleTradieQuery::class),
        app(TradieScorer::class),
    );

    $rank2Offer = JobOffer::where('job_id', $job->id)
        ->where('round', 1)
        ->where('rank_in_round', 2)
        ->first();

    expect($rank2Offer)->not->toBeNull();
    expect($rank2Offer->tradie_company_id)->toBe($company2->id);
});
