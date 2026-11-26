<?php

use App\Models\Job;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->actingAs(User::factory()->admin()->create());
    $this->contact = ['first_name' => 'Grace', 'last_name' => 'Njeri', 'email' => 'grace@example.test', 'phone' => '+254711234567', 'status' => 'active'];
});

it('adds an independent fundi without a business or portal password', function () {
    $this->post('/admin/fundis', $this->contact)->assertSessionHasNoErrors()->assertRedirect();
    $fundi = User::where('email', $this->contact['email'])->firstOrFail();
    expect($fundi->role->value)->toBe('tradie')->and($fundi->tradieCompany)->toBeNull();
    $this->get('/admin/fundis')->assertInertia(fn (Assert $page) => $page->has('records.data', 1));
    $this->delete("/admin/fundis/$fundi->id")->assertRedirect('/admin/fundis');
    expect(User::find($fundi->id))->toBeNull();
});

it('creates and edits fundi and business together and deletes both when unused', function () {
    $data = $this->contact + ['business_name' => 'Grace Repairs', 'trading_name' => 'Grace Fundi', 'abn' => 'KE-123', 'about_text' => 'Repairs in Nairobi'];
    $this->post('/admin/fundis', $data)->assertSessionHasNoErrors();
    $fundi = User::where('email', $data['email'])->firstOrFail();
    expect($fundi->tradieCompany->business_name)->toBe('Grace Repairs');
    $companyId = $fundi->tradieCompany->id;
    $this->get("/admin/fundis/$fundi->id/edit")->assertInertia(fn (Assert $page) => $page->where('record.business_name', 'Grace Repairs'));
    $data['first_name'] = 'Grace Updated';
    $data['business_name'] = 'Updated Repairs';
    $this->put("/admin/fundis/$fundi->id", $data)->assertSessionHasNoErrors();
    expect($fundi->fresh()->first_name)->toBe('Grace Updated');
    expect(TradieCompany::find($companyId)->business_name)->toBe('Updated Repairs');
    $this->delete("/admin/fundis/$fundi->id")->assertRedirect('/admin/fundis');
    expect(User::withTrashed()->find($fundi->id))->toBeNull();
    expect(TradieCompany::withTrashed()->find($companyId))->toBeNull();
});

it('can add optional business details to an existing independent fundi', function () {
    $this->post('/admin/fundis', $this->contact)->assertSessionHasNoErrors();
    $fundi = User::where('email', $this->contact['email'])->firstOrFail();
    $this->put("/admin/fundis/$fundi->id", $this->contact + ['business_name' => 'New business'])->assertSessionHasNoErrors();
    expect($fundi->fresh()->tradieCompany->business_name)->toBe('New business');
});

it('rejects incomplete business details and duplicate contacts without partial writes', function () {
    $this->post('/admin/fundis', $this->contact + ['abn' => 'KE-123'])->assertSessionHasErrors('business_name');
    expect(User::where('email', $this->contact['email'])->exists())->toBeFalse();
    $this->post('/admin/fundis', $this->contact + ['business_name' => str_repeat('x', 201)])->assertSessionHasErrors('business_name');
    expect(User::where('email', $this->contact['email'])->exists())->toBeFalse();
    User::factory()->create(['email' => $this->contact['email']]);
    $this->post('/admin/fundis', $this->contact + ['business_name' => 'Duplicate'])->assertSessionHasErrors('email');
    expect(TradieCompany::count())->toBe(0);
});

it('protects referenced businesses and scopes records to fundis', function () {
    $company = TradieCompany::factory()->create();
    Job::factory()->create(['assigned_tradie_company_id' => $company->id]);
    $this->delete("/admin/fundis/$company->owner_user_id")->assertSessionHasErrors('record');
    expect(User::find($company->owner_user_id))->not->toBeNull();
    expect(TradieCompany::find($company->id))->not->toBeNull();
    $member = User::factory()->member()->create();
    $this->get("/admin/fundis/$member->id/edit")->assertNotFound();
    $this->delete("/admin/fundis/$member->id")->assertNotFound();
});
