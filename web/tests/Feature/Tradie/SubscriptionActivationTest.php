<?php

use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows the activate-subscription page to an approved tradie', function () {
    $user = User::factory()->tradie()->create();
    TradieCompany::factory()->approved()->for($user, 'owner')->create();
    TradiePlan::factory()->standard()->create();

    $this->actingAs($user)
        ->get('/tradie/activate-subscription')
        ->assertStatus(200);
});
