<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows the login page', function () {
    $this->get('/login')->assertStatus(200);
});

it('logs in a member and redirects to member dashboard', function () {
    $user = User::factory()->member()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('logs in an admin and redirects to admin dashboard', function () {
    $user = User::factory()->admin()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/admin');

    $this->assertAuthenticatedAs($user);
});

it('logs in a tradie and redirects to tradie leads', function () {
    $user = User::factory()->tradie()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/tradie');

    $this->assertAuthenticatedAs($user);
});

it('rejects wrong credentials', function () {
    User::factory()->create(['email' => 'user@example.com']);

    $this->post('/login', [
        'email' => 'user@example.com',
        'password' => 'wrong-password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('logs out and redirects to login', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect('/login');

    $this->assertGuest();
});
