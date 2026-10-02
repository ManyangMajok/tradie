<?php

use App\Enums\TradieCompanyStatus;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Tradies index ───────────────────────────────────────────────────────────

it('shows tradies list to admin', function () {
    $admin = User::factory()->admin()->create();
    TradieCompany::factory()->approved()->count(3)->create();

    $this->actingAs($admin)->get('/admin/tradies')->assertStatus(200);
});

it('blocks non-admins from tradies list', function () {
    $member = User::factory()->member()->create();

    $this->actingAs($member)->get('/admin/tradies')->assertStatus(403);
});

// ─── Tradie show ─────────────────────────────────────────────────────────────

it('shows tradie detail page to admin', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->get("/admin/tradies/{$company->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Admin/Tradies/Show'));
});

// ─── Suspend ─────────────────────────────────────────────────────────────────

it('admin can suspend an approved tradie', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/tradies/{$company->id}/suspend", ['reason' => 'Multiple disputes'])
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Suspended);
    expect($company->suspended_reason)->toBe('Multiple disputes');
});

it('suspend requires a reason', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/tradies/{$company->id}/suspend", ['reason' => ''])
        ->assertSessionHasErrors('reason');

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Approved);
});

// ─── Reinstate ───────────────────────────────────────────────────────────────

it('admin can reinstate a suspended tradie', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->suspended()->create();

    $this->actingAs($admin)
        ->post("/admin/tradies/{$company->id}/reinstate")
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Approved);
    expect($company->suspended_reason)->toBeNull();
});

it('cannot reinstate an already-active tradie', function () {
    $admin = User::factory()->admin()->create();
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/tradies/{$company->id}/reinstate")
        ->assertSessionHas('error');

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Approved);
});
