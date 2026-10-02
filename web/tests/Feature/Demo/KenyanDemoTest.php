<?php

use App\Models\Job;
use App\Models\Review;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds repeatable Kenyan demo data with ratings backed by reviews', function () {
    $this->seed(DatabaseSeeder::class);
    $count = Job::count();
    $this->seed(DatabaseSeeder::class);
    expect(Job::count())->toBe($count)->and($count)->toBeGreaterThan(10);
    expect(Suburb::where('name', 'Westlands')->exists())->toBeTrue();
    $member = User::where('email', 'member@tradify.dev')->firstOrFail();
    expect($member->phone)->toStartWith('+254');
    foreach (TradieCompany::all() as $company) {
        $reviews = Review::where('tradie_company_id', $company->id);
        expect($company->rating_count)->toBe($reviews->count());
        if ($reviews->count()) {
            expect((float) $company->rating_average)->toBe(round((float) $reviews->avg('stars'), 2));
        }
    }
    $this->actingAs($member)->getJson('/jobs/available-tradies?'.http_build_query([
        'property_id' => $member->properties()->first()->id,
        'tradie_category_id' => TradieCategory::where('slug', 'plumber')->first()->id,
        'urgency' => 'flexible',
    ]))->assertOk()->assertJsonPath('location', 'Westlands');
});
