<?php

use App\Enums\SubscriptionStatus;
use App\Models\MemberPlan;
use App\Models\MemberSubscription;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Http::preventStrayRequests();
});

it('activates a member plan locally and makes repeated checkout idempotent', function () {
    $user = User::factory()->member()->create();
    $plan = MemberPlan::factory()->create(['stripe_price_id' => null]);
    foreach (range(1, 2) as $attempt) {
        $this->actingAs($user)->post('/register/member/plan', ['plan_id' => $plan->id])
            ->assertRedirect(route('membership.success'));
    }
    $this->assertDatabaseCount('member_subscriptions', 1);
    $this->assertDatabaseHas('member_subscriptions', [
        'user_id' => $user->id, 'member_plan_id' => $plan->id,
        'status' => 'active', 'stripe_subscription_id' => null,
        'end_date' => now()->addYear()->toDateString(),
    ]);
    Http::assertNothingSent();
});

it('rejects inactive member plans and other roles', function () {
    $plan = MemberPlan::factory()->create(['is_active' => false]);
    $this->actingAs(User::factory()->member()->create())
        ->post('/register/member/plan', ['plan_id' => $plan->id])->assertSessionHasErrors('plan_id');
    $this->actingAs(User::factory()->tradie()->create())
        ->post('/register/member/plan', ['plan_id' => $plan->id])->assertForbidden();
    $this->assertDatabaseCount('member_subscriptions', 0);
});

it('does not silently replace an existing active membership with another plan', function () {
    $user = User::factory()->member()->create();
    $subscription = MemberSubscription::factory()->active()->create(['user_id' => $user->id]);
    $other = MemberPlan::factory()->create();
    $this->actingAs($user)->post('/register/member/plan', ['plan_id' => $other->id])
        ->assertSessionHasErrors('plan_id');
    expect($subscription->fresh()->member_plan_id)->toBe($subscription->member_plan_id);
});

it('activates an approved tradie without Stripe and does not duplicate subscriptions', function () {
    $user = User::factory()->tradie()->create();
    $company = TradieCompany::factory()->approved()->for($user, 'owner')->create();
    $plan = TradiePlan::factory()->standard()->create(['stripe_price_id' => null]);
    foreach (range(1, 2) as $attempt) {
        $this->actingAs($user)->post('/tradie/activate-subscription', ['plan_id' => $plan->id])
            ->assertRedirect(route('tradie.subscription.success'));
    }
    $this->assertDatabaseCount('tradie_subscriptions', 1);
    $this->assertDatabaseHas('tradie_subscriptions', [
        'tradie_company_id' => $company->id, 'tradie_plan_id' => $plan->id,
        'status' => 'active', 'stripe_subscription_id' => null,
    ]);
    Http::assertNothingSent();
});

it('rejects unapproved tradies and inactive tradie plans', function () {
    $user = User::factory()->tradie()->create();
    $company = TradieCompany::factory()->for($user, 'owner')->create(['status' => 'pending_review']);
    $plan = TradiePlan::factory()->standard()->create();
    $this->actingAs($user)->post('/tradie/activate-subscription', ['plan_id' => $plan->id])->assertForbidden();
    $company->update(['status' => 'approved']);
    $plan->update(['is_active' => false]);
    $this->actingAs($user->fresh())->post('/tradie/activate-subscription', ['plan_id' => $plan->id])
        ->assertSessionHasErrors('plan_id');
    $this->assertDatabaseCount('tradie_subscriptions', 0);
});

it('cancels renewal locally without removing the remaining membership period', function () {
    $user = User::factory()->member()->create();
    $subscription = MemberSubscription::factory()->active()->create(['user_id' => $user->id]);
    $endDate = $subscription->end_date->toDateString();
    $this->actingAs($user)->post('/membership/cancel')->assertRedirect();
    $subscription->refresh();
    expect($subscription->auto_renew)->toBeFalse()
        ->and($subscription->canceled_at)->not->toBeNull()
        ->and($subscription->status)->toBe(SubscriptionStatus::Active)
        ->and($subscription->end_date->toDateString())->toBe($endDate);
    Http::assertNothingSent();
});

it('keeps billing portal links local and disables provider webhooks', function () {
    $this->actingAs(User::factory()->member()->create())->get('/membership/portal')
        ->assertRedirect(route('membership'));
    $user = User::factory()->tradie()->create();
    TradieCompany::factory()->approved()->for($user, 'owner')->create();
    $this->actingAs($user)->get('/tradie/subscription/portal')->assertRedirect(route('tradie.subscription'));
    $this->postJson('/webhooks/stripe', [])->assertNotFound();
    Http::assertNothingSent();
});
