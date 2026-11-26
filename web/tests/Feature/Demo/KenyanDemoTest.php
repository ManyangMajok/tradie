<?php

use App\Models\Job;
use App\Models\Suburb;
use App\Models\TradieCompany;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('seeds repeatable Kenyan CRUD records without resetting changed passwords', function () {
    $this->seed(DatabaseSeeder::class);
    $count = Job::count();
    $admin = User::where('email', 'admin@tradify.dev')->firstOrFail();
    $admin->update(['password' => 'changed-password']);
    $this->seed(DatabaseSeeder::class);
    expect(Job::count())->toBe($count)->and($count)->toBe(1);
    expect(Suburb::where('name', 'Westlands')->exists())->toBeTrue();
    expect(TradieCompany::count())->toBe(1);
    expect(Hash::check('changed-password', $admin->fresh()->password))->toBeTrue();
});
