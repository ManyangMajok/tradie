<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Suburb;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows the member registration page', function () {
    $this->get('/register/member')->assertStatus(200);
});

it('creates a member account and redirects to property step', function () {
    $this->post('/register/member', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'phone' => '+61412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect('/register/member/property');

    $this->assertDatabaseHas('users', [
        'email' => 'jane@example.com',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'role' => UserRole::Member->value,
        'status' => UserStatus::PendingVerification->value,
    ]);

    $this->assertAuthenticated();
});

it('rejects registration with a duplicate email', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $this->post('/register/member', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'existing@example.com',
        'phone' => '+61412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHasErrors('email');
});

it('rejects a non-Australian phone number', function () {
    $this->post('/register/member', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@example.com',
        'phone' => '0412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHasErrors('phone');
});

it('shows the property step when authenticated', function () {
    $user = User::factory()->member()->create();
    $suburb = Suburb::factory()->create();

    $this->actingAs($user)
        ->get('/register/member/property')
        ->assertStatus(200);
});

it('creates a property and redirects to plan step', function () {
    $user = User::factory()->member()->create();
    $suburb = Suburb::factory()->create();

    $this->actingAs($user)
        ->post('/register/member/property', [
            'label' => 'Home',
            'address_line_1' => '1 Test Street',
            'suburb_id' => $suburb->id,
            'property_type' => 'house',
            'gate_code' => '',
            'access_notes' => '',
        ])->assertRedirect('/register/member/plan');

    $this->assertDatabaseHas('properties', [
        'member_user_id' => $user->id,
        'label' => 'Home',
        'address_line_1' => '1 Test Street',
        'is_primary' => true,
    ]);
});
