<?php

use App\Actions\Dispatch\AcceptOfferAction;
use App\Actions\Dispatch\DeclineOfferAction;
use App\Enums\JobStatus;
use App\Jobs\Dispatch\AdvanceToNextRank;
use App\Jobs\Dispatch\ExpireOffer;
use App\Models\Job;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\TradieSubscription;
use App\Models\User;
use App\Services\AvailableTradies;
use App\Services\EligibleTradieQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

function choiceJob(): Job
{
    $property = Property::factory()->create();

    return Job::factory()->create(['property_id' => $property->id, 'member_user_id' => $property->member_user_id, 'submitted_at' => now()->subDay()]);
}

function choiceCandidate(Job $job, ?float $rating = 4.5, int $boost = 0): TradieCompany
{
    $company = TradieCompany::factory()->approved()->create(['rating_average' => $rating, 'rating_count' => $rating === null ? 0 : 10]);
    $plan = TradiePlan::factory()->create(['dispatch_rank_boost' => $boost]);
    TradieSubscription::factory()->active()->create(['tradie_company_id' => $company->id, 'tradie_plan_id' => $plan->id]);
    $company->categories()->create(['tradie_category_id' => $job->tradie_category_id, 'is_active' => true]);
    $company->serviceAreas()->create(['suburb_id' => $job->property->suburb_id, 'is_active' => true]);
    foreach (range(0, 6) as $day) {
        $company->availability()->create(['day_of_week' => $day, 'opens_at' => '00:00:00', 'closes_at' => '23:59:59', 'accepts_emergency' => true]);
    }

    return $company;
}

function choicePayload(Job $job, ?int $companyId = null): array
{
    return ['property_id' => $job->property_id, 'tradie_category_id' => $job->tradie_category_id,
        'custom_issue' => 'Leaking kitchen tap', 'urgency' => 'flexible',
        'description' => 'The kitchen tap needs to be repaired.', 'selected_tradie_company_id' => $companyId];
}

beforeEach(function () {
    Queue::fake();
    Notification::fake();
});

it('lists every available local tradie ordered by rating rather than plan boost', function () {
    $job = choiceJob();
    $low = choiceCandidate($job, 3.5, 100);
    $high = choiceCandidate($job, 4.9);
    $unrated = choiceCandidate($job, null);
    $middle = choiceCandidate($job, 4.2);
    $otherArea = choiceCandidate($job, 5.0);
    $otherArea->serviceAreas()->update(['is_active' => false]);
    $suspended = choiceCandidate($job, 5.0);
    $suspended->update(['status' => 'suspended']);
    $response = $this->actingAs($job->member)->getJson('/jobs/available-tradies?'.http_build_query(choicePayload($job)))->assertOk();
    expect(array_column($response->json('tradies'), 'id'))->toBe([$high->id, $middle->id, $low->id, $unrated->id]);
    $response->assertJsonPath('location', $job->property->suburb->name)
        ->assertJsonMissingPath('tradies.0.owner_user_id')->assertJsonMissingPath('tradies.0.phone');
});

it('does not disclose another member property or accept an inactive category', function () {
    $job = choiceJob();
    $this->actingAs(User::factory()->member()->create())
        ->getJson('/jobs/available-tradies?'.http_build_query(choicePayload($job)))->assertUnprocessable();
    $job->category->update(['is_active' => false]);
    $this->actingAs($job->member)->getJson('/jobs/available-tradies?'.http_build_query(choicePayload($job)))->assertUnprocessable();
});

it('excludes unavailable hours categories subscriptions and soft deleted service areas', function () {
    $job = choiceJob();
    $closed = choiceCandidate($job);
    $closed->availability()->delete();
    $wrongTrade = choiceCandidate($job);
    $wrongTrade->categories()->update(['is_active' => false]);
    $inactive = choiceCandidate($job);
    $inactive->subscriptions()->update(['status' => 'canceled']);
    $deletedArea = choiceCandidate($job);
    $deletedArea->serviceAreas()->delete();
    $this->actingAs($job->member)->getJson('/jobs/available-tradies?'.http_build_query(choicePayload($job)))
        ->assertOk()->assertJsonCount(0, 'tradies');
});

it('requires a choice and offers a new job only to the member selected tradie', function () {
    $job = choiceJob();
    $chosen = choiceCandidate($job, 3.8);
    choiceCandidate($job, 5.0, 100);
    $this->actingAs($job->member)->postJson('/jobs', choicePayload($job))->assertUnprocessable();
    $response = $this->postJson('/jobs', choicePayload($job, $chosen->id))->assertCreated();
    $created = Job::findOrFail($response->json('job.id'));
    expect($created->selected_tradie_company_id)->toBe($chosen->id)
        ->and($created->assigned_tradie_company_id)->toBeNull()
        ->and($created->status)->toBe(JobStatus::Offered)
        ->and($created->offers()->pluck('tradie_company_id')->all())->toBe([$chosen->id]);
    $this->postJson('/jobs', choicePayload($job, $chosen->id))->assertOk()->assertJsonPath('job.id', $created->id);
    expect($created->offers()->count())->toBe(1);
});

it('rejects a stale or forged choice without leaving a partial job', function () {
    $job = choiceJob();
    $chosen = choiceCandidate($job);
    $chosen->update(['status' => 'suspended']);
    $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $chosen->id))->assertUnprocessable();
    $this->assertDatabaseCount('jobs', 1);
    $this->assertDatabaseCount('job_offers', 0);
});

it('redirects an Inertia submission to the created job instead of returning raw JSON', function () {
    $job = choiceJob();
    $chosen = choiceCandidate($job);
    $this->actingAs($job->member)->post('/jobs', choicePayload($job, $chosen->id))->assertRedirect();
    expect(Job::latest('id')->first()->selected_tradie_company_id)->toBe($chosen->id);
});

it('does not automatically offer a declined or expired chosen job to someone else', function (string $outcome) {
    $job = choiceJob();
    $chosen = choiceCandidate($job);
    $alternative = choiceCandidate($job, 5.0);
    $response = $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $chosen->id))->assertCreated();
    $created = Job::findOrFail($response->json('job.id'));
    $offer = $created->offers()->first();
    if ($outcome === 'declined') {
        app(DeclineOfferAction::class)->execute($offer, $chosen->owner, 'busy');
    } else {
        $offer->update(['expires_at' => now()->subSecond()]);
        app()->call([new ExpireOffer($offer->id), 'handle']);
    }
    app()->call([new AdvanceToNextRank($created->id, 1), 'handle']);
    expect($created->fresh()->status)->toBe(JobStatus::PendingDispatch)
        ->and($created->offers()->count())->toBe(1);
    $this->actingAs($created->member)->post('/jobs/'.$created->public_id.'/choose-tradie', ['selected_tradie_company_id' => $alternative->id])->assertRedirect();
    expect($created->fresh()->selected_tradie_company_id)->toBe($alternative->id)
        ->and($created->offers()->count())->toBe(2);
    // A retry of the old advance job cannot disrupt the new choice.
    app()->call([new AdvanceToNextRank($created->id, 1), 'handle']);
    expect($created->fresh()->status)->toBe(JobStatus::Offered);
})->with(['declined', 'expired']);

it('does not allow another member to change a choice or replace a live offer', function () {
    $job = choiceJob();
    $chosen = choiceCandidate($job);
    $other = choiceCandidate($job);
    $response = $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $chosen->id))->assertCreated();
    $created = Job::findOrFail($response->json('job.id'));
    $path = '/jobs/'.$created->public_id.'/choose-tradie';
    $this->postJson($path, ['selected_tradie_company_id' => $other->id])->assertStatus(409);
    $this->actingAs(User::factory()->member()->create())->postJson($path, ['selected_tradie_company_id' => $other->id])->assertNotFound();
});

it('assigns the chosen tradie only after they accept and rejects a different duplicate choice', function () {
    $job = choiceJob();
    $chosen = choiceCandidate($job);
    $other = choiceCandidate($job);
    $response = $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $chosen->id))->assertCreated();
    $created = Job::findOrFail($response->json('job.id'));
    $this->postJson('/jobs', choicePayload($job, $other->id))->assertUnprocessable();
    app(AcceptOfferAction::class)->execute($created->offers()->first(), $chosen->owner);
    expect($created->fresh()->status)->toBe(JobStatus::Assigned)
        ->and($created->fresh()->assigned_tradie_company_id)->toBe($chosen->id);
});

it('suggests other areas only when no local candidate exists and preserves normal eligibility', function () {
    $job = choiceJob();
    $area = Suburb::factory()->create(['state' => $job->property->suburb->state]);
    $alternative = choiceCandidate($job, 4.9);
    $alternative->serviceAreas()->update(['suburb_id' => $area->id]);
    $inactive = choiceCandidate($job);
    $inactive->serviceAreas()->update(['suburb_id' => $area->id]);
    $inactive->owner->update(['status' => 'suspended']);
    $local = choiceCandidate($job, 3.0);
    $service = app(AvailableTradies::class);
    expect($service->forJob($job)->pluck('id')->all())->toBe([$local->id]);
    $local->availability()->delete();
    $results = $service->forJob($job);
    expect($results->pluck('id')->all())->toBe([$alternative->id])
        ->and($results->first()->match_type)->toBe('alternative')
        ->and($results->first()->service_area_names)->toContain($area->name);
    expect(app(EligibleTradieQuery::class)->get($job)->pluck('id')->all())->not->toContain($alternative->id);
});

it('orders alternatives by area distance then ratings and handles missing coordinates honestly', function () {
    $job = choiceJob();
    $job->property->suburb->update(['latitude' => 0, 'longitude' => 0]);
    $near = choiceCandidate($job, 3.0);
    $far = choiceCandidate($job, 5.0);
    $unknown = choiceCandidate($job, 5.0);
    foreach ([[$near, 0.1], [$far, 1], [$unknown, null]] as [$company, $longitude]) {
        $area = Suburb::factory()->create(['latitude' => $longitude === null ? null : 0, 'longitude' => $longitude]);
        $company->serviceAreas()->update(['suburb_id' => $area->id]);
    }
    $results = app(AvailableTradies::class)->forJob($job);
    expect($results->pluck('id')->all())->toBe([$near->id, $far->id, $unknown->id])
        ->and($results->first()->area_distance_km)->toBe(11.1)
        ->and($results->last()->area_distance_km)->toBeNull();
});

it('allows an explicitly selected alternative and records travel confirmation on its offer', function () {
    $job = choiceJob();
    $company = choiceCandidate($job);
    $company->serviceAreas()->update(['suburb_id' => Suburb::factory()->create()->id]);
    $response = $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $company->id))->assertCreated();
    $created = Job::findOrFail($response->json('job.id'));
    $offer = $created->offers()->first();
    expect($offer->travel_confirmation_required)->toBeTrue();
    $this->actingAs($company->owner)->get('/tradie/leads/'.$offer->id)->assertOk();
    app(AcceptOfferAction::class)->execute($offer, $company->owner);
    expect($created->fresh()->assigned_tradie_company_id)->toBe($company->id);
});

it('prioritises the same county when distances are unknown and rejects a stale alternative choice', function () {
    $job = choiceJob();
    $job->property->suburb->update(['latitude' => null, 'longitude' => null]);
    $same = choiceCandidate($job, 3);
    $other = choiceCandidate($job, 5);
    $same->serviceAreas()->update(['suburb_id' => Suburb::factory()->create(['state' => $job->property->suburb->state, 'latitude' => null, 'longitude' => null])->id]);
    $other->serviceAreas()->update(['suburb_id' => Suburb::factory()->create(['state' => 'Kiambu', 'latitude' => null, 'longitude' => null])->id]);
    expect(app(AvailableTradies::class)->forJob($job)->pluck('id')->all())->toBe([$same->id, $other->id]);
    choiceCandidate($job);
    $this->actingAs($job->member)->postJson('/jobs', choicePayload($job, $same->id))->assertUnprocessable();
    $this->assertDatabaseCount('job_offers', 0);
});

it('validates paired area coordinates through admin location editing', function () {
    $area = Suburb::factory()->create();
    $payload = ['name' => $area->name, 'postcode' => $area->postcode, 'state' => $area->state, 'is_active' => true, 'latitude' => -1.28, 'longitude' => 36.82];
    $this->actingAs(User::factory()->admin()->create())->put('/admin/locations/'.$area->id, $payload)->assertSessionHasNoErrors();
    expect($area->fresh()->latitude)->toBe(-1.28)->and($area->fresh()->longitude)->toBe(36.82);
    $this->put('/admin/locations/'.$area->id, [...$payload, 'latitude' => 91])->assertSessionHasErrors('latitude');
    $this->put('/admin/locations/'.$area->id, [...$payload, 'longitude' => null])->assertSessionHasErrors('longitude');
});

it('ranks local saved base pins by distance and labels them separately from area estimates', function () {
    $job = choiceJob();
    $job->property->update(['latitude' => 0, 'longitude' => 0]);
    $near = choiceCandidate($job, 3.0);
    $far = choiceCandidate($job, 5.0);
    $unknown = choiceCandidate($job, 4.9);
    $near->update(['latitude' => 0, 'longitude' => 0.1]);
    $far->update(['latitude' => 0, 'longitude' => 1]);
    $results = app(AvailableTradies::class)->forJob($job);
    expect($results->pluck('id')->all())->toBe([$near->id, $far->id, $unknown->id])
        ->and($results->first()->distance_km)->toBe(11.1)
        ->and($results->first()->distance_basis)->toBe('base')
        ->and($results->first()->map_latitude)->toBe(0.0)
        ->and($results->last()->distance_km)->toBeNull();
});
