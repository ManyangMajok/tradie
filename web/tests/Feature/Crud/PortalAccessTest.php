<?php

use App\Models\Job;
use App\Models\JobOffer;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\TradiePlan;
use App\Models\TradieSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('routes active accounts to their own portal and rejects suspended logins', function () {
    foreach (['admin' => '/admin', 'member' => '/dashboard', 'tradie' => '/tradie'] as $role => $path) {
        $user = User::factory()->create(['role' => $role, 'status' => 'active']);
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect($path);
        $this->get($path)->assertOk();
        $this->post('/logout');
        $user->update(['status' => 'suspended']);
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }
});

it('allows an admin to create a single-use password setup link without sending email', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->member()->create();
    $this->actingAs($admin)->post("/admin/people/$member->id/password-link")->assertRedirect()->assertSessionHas('setup_url');
    $url = session('setup_url');
    parse_str(parse_url($url, PHP_URL_QUERY), $query);
    $token = basename(parse_url($url, PHP_URL_PATH));
    $this->post('/logout');
    $this->post('/password/reset', ['email' => $query['email'], 'token' => $token, 'password' => 'NewPassword123', 'password_confirmation' => 'NewPassword123'])->assertRedirect('/login');
    expect(Hash::check('NewPassword123', $member->fresh()->password))->toBeTrue();
    $this->post('/password/reset', ['email' => $query['email'], 'token' => $token, 'password' => 'OtherPassword123', 'password_confirmation' => 'OtherPassword123'])->assertSessionHasErrors('email');
    $this->actingAs($member)->post("/admin/people/$member->id/password-link")->assertForbidden();
});

it('provides an independent fundi service profile without requiring business information', function () {
    $fundi = User::factory()->tradie()->create();
    $this->actingAs($fundi)->get('/tradie/settings')->assertOk();
    $profile = $fundi->fresh()->tradieCompany;
    expect($profile)->not->toBeNull()->and($profile->is_independent)->toBeTrue();
    expect($profile->business_name)->toBe("$fundi->first_name $fundi->last_name");
    $this->get('/tradie/categories')->assertOk();
    $this->get('/tradie/service-areas')->assertOk();
    $this->get('/tradie/availability')->assertOk();
    $this->get('/tradie/performance')->assertOk();
    $this->get('/tradie/subscription')->assertOk();
});

it('restricts portal data and property edits to their owner', function () {
    $member = User::factory()->member()->create();
    $other = User::factory()->member()->create();
    $property = Property::factory()->create(['member_user_id' => $other->id]);
    $this->actingAs($member)->get("/properties/$property->id/edit")->assertForbidden();
    $this->delete("/properties/$property->id")->assertForbidden();
    $this->get('/tradie')->assertForbidden();
    $this->get('/admin')->assertForbidden();
    $this->post('/properties', ['label' => 'Home', 'address_line_1' => 'Test address', 'suburb_id' => $property->suburb_id, 'property_type' => 'house'])->assertSessionHasNoErrors();
    expect($member->properties()->count())->toBe(1);
    $this->actingAs($member)->get('/properties')->assertInertia(fn (Assert $page) => $page->has('properties', 1));
    $member->update(['status' => 'suspended']);
    $this->get('/dashboard')->assertForbidden();
});

it('keeps a lead acceptible after viewing and renders live leads on the fundi homepage', function () {
    Queue::fake();
    $company = TradieCompany::factory()->approved()->create();
    $job = Job::factory()->create(['status' => 'offered', 'selected_tradie_company_id' => $company->id]);
    $offer = JobOffer::factory()->create(['job_id' => $job->id, 'tradie_company_id' => $company->id, 'status' => 'offered', 'expires_at' => now()->addHour()]);
    $this->actingAs($company->owner)->get('/tradie')->assertInertia(fn (Assert $page) => $page->has('leads', 1));
    $this->get("/tradie/leads/$offer->id")->assertOk();
    expect($offer->fresh()->viewed_at)->not->toBeNull();
    $this->postJson("/tradie/leads/$offer->id/accept")->assertOk();
    expect($job->fresh()->assigned_tradie_company_id)->toBe($company->id);
});

it('supports an independent fundi and client from setup through completion and review', function () {
    Queue::fake();
    Notification::fake();
    $member = User::factory()->member()->create();
    $fundi = User::factory()->tradie()->create();
    $location = Suburb::factory()->create();
    $category = TradieCategory::factory()->create();
    $this->actingAs($fundi)->get('/tradie')->assertOk();
    $profile = $fundi->fresh()->tradieCompany;
    $this->post('/tradie/categories', ['category_id' => $category->id])->assertSessionHasNoErrors();
    $this->post('/tradie/service-areas', ['suburb_id' => $location->id])->assertSessionHasNoErrors();
    $hours = collect(range(0, 6))->map(fn ($day) => ['day_of_week' => $day, 'is_open' => true, 'opens_at' => '00:00', 'closes_at' => '23:59', 'accepts_emergency' => true])->all();
    $this->patch('/tradie/availability', ['availability' => $hours])->assertSessionHasNoErrors();
    $this->get('/tradie/availability')->assertInertia(fn (Assert $page) => $page->where('availability.0.opens_at', '00:00'));
    $plan = TradiePlan::factory()->create();
    $this->post('/tradie/activate-subscription', ['plan_id' => $plan->id])->assertSessionHasNoErrors()->assertRedirect('/tradie/activate-subscription/success');
    $this->actingAs($member)->post('/properties', ['label' => 'My home', 'address_line_1' => 'Westlands Road', 'suburb_id' => $location->id, 'property_type' => 'house'])->assertSessionHasNoErrors();
    $property = $member->properties()->firstOrFail();
    $payload = ['property_id' => $property->id, 'tradie_category_id' => $category->id, 'custom_issue' => 'Leaking kitchen tap', 'urgency' => 'flexible', 'description' => 'The kitchen tap needs a repair.', 'selected_tradie_company_id' => $profile->id];
    $this->getJson('/jobs/available-tradies?'.http_build_query($payload))->assertOk()->assertJsonPath('tradies.0.id', $profile->id);
    $this->post('/jobs', $payload)->assertSessionHasNoErrors()->assertRedirect();
    $job = Job::latest('id')->firstOrFail();
    $offer = $job->offers()->firstOrFail();
    $this->actingAs($fundi)->get("/tradie/leads/$offer->id")->assertOk();
    $this->post("/tradie/leads/$offer->id/accept")->assertRedirect("/tradie/jobs/$job->public_id");
    $this->post("/tradie/jobs/$job->public_id/status", ['to_status' => 'in_progress'])->assertRedirect("/tradie/jobs/$job->public_id");
    $this->post("/tradie/jobs/$job->public_id/complete", ['summary_of_work' => 'Replaced the broken kitchen tap.', 'invoice_total_cents' => 450000, 'no_callout_fee_confirmed' => true, 'discount_applied' => true, 'discount_amount_cents' => 50000])->assertSessionHasNoErrors()->assertRedirect("/tradie/jobs/$job->public_id");
    $this->get('/tradie/performance')->assertInertia(fn (Assert $page) => $page->where('stats.jobs_completed', 1)->where('stats.reported_revenue_cents', 450000));
    $this->actingAs($member)->post("/jobs/$job->public_id/review", ['stars' => 5, 'work_completed_status' => 'yes', 'no_callout_fee_honoured' => true, 'discount_honoured' => 'yes', 'review_text' => 'Great work.'])->assertSessionHasNoErrors()->assertRedirect("/jobs/$job->public_id");
    expect($job->fresh()->status->value)->toBe('confirmed');
    $this->post('/saved-tradies', ['tradie_company_id' => $profile->id])->assertSessionHasNoErrors();
    $this->post('/saved-tradies', ['tradie_company_id' => $profile->id])->assertSessionHasNoErrors();
    $this->get('/saved-tradies')->assertInertia(fn (Assert $page) => $page->has('savedTradies', 1)->where('savedTradies.0.company.categories.0', $category->name));
    $this->actingAs(User::factory()->admin()->create())->delete("/admin/jobs/$job->id")->assertSessionHasErrors('record');
});

it('does not list a suspended fundi as available', function () {
    $property = Property::factory()->create();
    $job = Job::factory()->create(['property_id' => $property->id, 'member_user_id' => $property->member_user_id]);
    $company = TradieCompany::factory()->approved()->create();
    TradieSubscription::factory()->active()->create(['tradie_company_id' => $company->id]);
    $company->categories()->create(['tradie_category_id' => $job->tradie_category_id, 'is_active' => true]);
    $company->serviceAreas()->create(['suburb_id' => $property->suburb_id, 'is_active' => true]);
    $company->availability()->create(['day_of_week' => now()->dayOfWeek, 'opens_at' => '00:00', 'closes_at' => '23:59', 'accepts_emergency' => true]);
    $company->owner->update(['status' => 'suspended']);
    $this->actingAs($job->member)->getJson('/jobs/available-tradies?'.http_build_query(['property_id' => $job->property_id, 'tradie_category_id' => $job->tradie_category_id, 'urgency' => 'flexible']))->assertOk()->assertJsonCount(0, 'tradies');
});
