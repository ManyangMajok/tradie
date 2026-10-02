<?php

use App\Enums\TradieCompanyStatus;
use App\Models\TradieCompany;
use App\Models\User;
use App\Notifications\TradieApplicationApproved;
use App\Notifications\TradieApplicationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(fn () => Notification::fake());

it('shows pending applications to admin', function () {
    $admin = User::factory()->admin()->create();
    TradieCompany::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get('/admin/applications')
        ->assertStatus(200);
});

it('approves an application and notifies the tradie', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/applications/{$company->id}/approve")
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Approved);
    expect($company->approved_by_user_id)->toBe($admin->id);
    expect($company->approved_at)->not->toBeNull();

    Notification::assertSentTo($company->owner, TradieApplicationApproved::class);
});

it('rejects an application with a reason and notifies the tradie', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->create();

    $this->actingAs($admin)
        ->post("/admin/applications/{$company->id}/reject", ['reason' => 'Licence expired'])
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Rejected);

    Notification::assertSentTo($company->owner, TradieApplicationRejected::class,
        fn ($n) => $n->reason === 'Licence expired'
    );
});

it('cannot approve an already-processed application', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/applications/{$company->id}/approve")
        ->assertSessionHas('error');
});

it('blocks non-admins from the applications page', function () {
    $member = User::factory()->member()->create();

    $this->actingAs($member)
        ->get('/admin/applications')
        ->assertStatus(403);
});
