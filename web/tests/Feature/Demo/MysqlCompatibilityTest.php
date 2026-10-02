<?php

use App\Enums\SubscriptionStatus;
use App\Jobs\Dispatch\ExpireOffer;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\MemberSubscription;
use App\Models\Property;
use App\Models\TradieCompany;
use App\Models\TradieSubscription;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('enforces one live member subscription while allowing subscription history', function () {
    $subscription = MemberSubscription::factory()->active()->create();
    MemberSubscription::factory()->create(['user_id' => $subscription->user_id, 'status' => SubscriptionStatus::Canceled]);
    expect(fn () => MemberSubscription::factory()->active()->create(['user_id' => $subscription->user_id]))
        ->toThrow(QueryException::class);
});

it('enforces one live tradie subscription', function () {
    $subscription = TradieSubscription::factory()->active()->create();
    expect(fn () => TradieSubscription::factory()->create([
        'tradie_company_id' => $subscription->tradie_company_id, 'status' => SubscriptionStatus::PastDue,
    ]))->toThrow(QueryException::class);
});

it('enforces one primary property but allows multiple secondary properties', function () {
    $property = Property::factory()->create(['is_primary' => true]);
    Property::factory()->count(2)->create(['member_user_id' => $property->member_user_id, 'is_primary' => false]);
    expect(fn () => Property::factory()->create(['member_user_id' => $property->member_user_id, 'is_primary' => true]))
        ->toThrow(QueryException::class);
});

it('keeps email uniqueness case insensitive for live users', function () {
    User::factory()->create(['email' => 'Member@example.test']);
    expect(fn () => User::factory()->create(['email' => 'member@example.test']))->toThrow(QueryException::class);
});

it('allows reuse of email and phone after soft deletion', function () {
    $user = User::factory()->create();
    $user->delete();
    $replacement = User::factory()->create(['email' => $user->email, 'phone' => $user->phone]);
    expect($replacement->id)->not->toBe($user->id);
});

it('keeps company owner uniqueness while allowing a deleted company to be replaced', function () {
    $company = TradieCompany::factory()->create();
    $company->delete();
    TradieCompany::factory()->create(['owner_user_id' => $company->owner_user_id]);
    expect(fn () => TradieCompany::factory()->create(['owner_user_id' => $company->owner_user_id]))
        ->toThrow(QueryException::class);
});

it('calculates response seconds on MySQL from the original offer timestamps', function () {
    $offer = JobOffer::factory()->create([
        'offered_at' => '2026-10-02 08:00:00', 'accepted_at' => '2026-10-02 08:01:25',
    ]);
    expect($offer->fresh()->response_time_seconds)->toBe(85);
    $offer->update(['accepted_at' => null]);
    expect($offer->fresh()->response_time_seconds)->toBeNull();
});

it('stores delayed expiry work separately from domain jobs and does not pop it early', function () {
    // This test uses the real database queue rather than Queue::fake().
    config(['queue.connections.database.after_commit' => false]);
    $offer = JobOffer::factory()->create();
    $jobCount = Job::count();
    Queue::connection('database')->later(now()->addMinutes(10), new ExpireOffer($offer->id));
    expect(DB::table('queue_jobs')->count())->toBe(1)
        ->and(Job::count())->toBe($jobCount)
        ->and(Queue::connection('database')->pop())->toBeNull();
});
