<?php

use App\Models\IssueType;
use App\Models\Job;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
});

it('restricts every CRUD operation to active admins', function () {
    $this->get('/admin')->assertRedirect('/login');
    foreach (['member', 'tradie'] as $role) {
        $user = User::factory()->create(['role' => $role]);
        $this->actingAs($user)->get('/admin/locations')->assertForbidden();
        $this->post('/admin/locations', [])->assertForbidden();
        $this->put('/admin/locations/1', [])->assertForbidden();
        $this->delete('/admin/locations/1')->assertForbidden();
    }
    $this->admin->update(['status' => 'suspended']);
    $this->actingAs($this->admin)->get('/admin')->assertForbidden();
});

it('allows active role sign in and rejects suspended admins', function () {
    $this->post('/login', ['email' => $this->admin->email, 'password' => 'password'])->assertRedirect('/admin');
    $this->post('/logout')->assertRedirect('/login');
    $member = User::factory()->create(['role' => 'member']);
    $this->post('/login', ['email' => $member->email, 'password' => 'password'])->assertRedirect('/dashboard');
    $this->post('/logout');
    $this->admin->update(['status' => 'suspended']);
    $this->post('/login', ['email' => $this->admin->email, 'password' => 'password'])->assertSessionHasErrors('email');
});

it('provides full CRUD for each reference resource', function (string $resource, string $model, array $data) {
    $this->actingAs($this->admin);
    if ($resource === 'issue-types') {
        $data['tradie_category_id'] = TradieCategory::factory()->create()->id;
    }
    $this->get("/admin/$resource/create")->assertOk();
    $this->post("/admin/$resource", $data)->assertSessionHasNoErrors()->assertRedirect();
    $record = $model::latest('id')->firstOrFail();
    $this->get("/admin/$resource/$record->id")->assertOk();
    $this->get("/admin/$resource/$record->id/edit")->assertOk();
    $data['name'] = 'Updated name';
    $this->put("/admin/$resource/$record->id", $data)->assertSessionHasNoErrors()->assertRedirect();
    expect($record->fresh()->name)->toBe('Updated name');
    $this->delete("/admin/$resource/$record->id")->assertRedirect("/admin/$resource");
    expect($model::find($record->id))->toBeNull();
})->with([
    ['locations', Suburb::class, ['name' => 'Demo location', 'postcode' => '00100', 'state' => 'KE', 'is_active' => true]],
    ['categories', TradieCategory::class, ['name' => 'Demo trade', 'slug' => 'demo-trade', 'sort_order' => 0, 'is_active' => true]],
    ['issue-types', IssueType::class, ['name' => 'Demo issue', 'slug' => 'demo-issue', 'sort_order' => 0, 'is_active' => true]],
]);

it('manages people without exposing passwords or allowing admin escalation', function () {
    $this->actingAs($this->admin);
    $data = ['first_name' => 'Amina', 'last_name' => 'Otieno', 'email' => 'amina@example.test', 'phone' => '+254711999001', 'role' => 'member', 'status' => 'active', 'password' => 'demonstration123'];
    $this->post('/admin/people', $data)->assertSessionHasNoErrors();
    $person = User::where('email', $data['email'])->firstOrFail();
    expect(Hash::check($data['password'], $person->password))->toBeTrue();
    $this->get("/admin/people/$person->id/edit")->assertInertia(fn (Assert $page) => $page->component('Crud/Form')->where('record.password', ''));
    $data['password'] = '';
    $data['first_name'] = 'Amina updated';
    $this->put("/admin/people/$person->id", $data)->assertSessionHasNoErrors();
    expect(Hash::check('demonstration123', $person->fresh()->password))->toBeTrue();
    $data['role'] = 'admin';
    $this->put("/admin/people/$person->id", $data)->assertSessionHasErrors('role');
    $this->get("/admin/people/{$this->admin->id}")->assertNotFound();
    $this->delete("/admin/people/{$this->admin->id}")->assertNotFound();
    $this->delete("/admin/people/$person->id")->assertRedirect('/admin/people');
    expect(User::withTrashed()->find($person->id))->toBeNull();
});

it('manages companies, properties and jobs manually without dispatch', function () {
    Queue::fake();
    $this->actingAs($this->admin);
    $owner = User::factory()->create(['role' => 'tradie']);
    $member = User::factory()->create(['role' => 'member']);
    $location = Suburb::factory()->create();
    $category = TradieCategory::factory()->create();
    $companyData = ['owner_user_id' => $owner->id, 'business_name' => 'Nairobi Repairs', 'about_text' => 'Local repairs', 'status' => 'approved'];
    $this->post('/admin/tradies', $companyData)->assertSessionHasNoErrors();
    $company = TradieCompany::latest('id')->firstOrFail();
    $companyData['business_name'] = 'Nairobi Repairs Updated';
    $this->put("/admin/tradies/$company->id", $companyData)->assertSessionHasNoErrors();
    expect($company->fresh()->business_name)->toBe('Nairobi Repairs Updated');
    $propertyData = ['member_user_id' => $member->id, 'label' => 'Home', 'address_line_1' => '10 Demo Road', 'suburb_id' => $location->id, 'property_type' => 'house'];
    $this->post('/admin/properties', $propertyData)->assertSessionHasNoErrors();
    $property = Property::latest('id')->firstOrFail();
    $propertyData['label'] = 'Main home';
    $this->put("/admin/properties/$property->id", $propertyData)->assertSessionHasNoErrors();
    $jobData = ['property_id' => $property->id, 'tradie_category_id' => $category->id, 'custom_issue' => 'Leaking tap', 'description' => 'Kitchen tap', 'urgency' => 'flexible', 'status' => 'pending_dispatch'];
    $this->post('/admin/jobs', $jobData)->assertSessionHasNoErrors();
    $job = Job::latest('id')->firstOrFail();
    expect($job->member_user_id)->toBe($member->id);
    $jobData['status'] = 'in_progress';
    $jobData['assigned_tradie_company_id'] = $company->id;
    $this->put("/admin/jobs/$job->id", $jobData)->assertSessionHasNoErrors();
    $jobData['status'] = 'completed';
    $this->put("/admin/jobs/$job->id", $jobData)->assertSessionHasNoErrors();
    expect($job->fresh()->completed_at)->not->toBeNull();
    $jobData['status'] = 'pending_dispatch';
    $this->put("/admin/jobs/$job->id", $jobData)->assertSessionHasNoErrors();
    expect($job->fresh()->completed_at)->toBeNull();
    $this->delete("/admin/properties/$property->id")->assertSessionHasErrors('record');
    $this->delete("/admin/tradies/$company->id")->assertSessionHasErrors('record');
    $this->delete("/admin/jobs/$job->id")->assertRedirect('/admin/jobs');
    $this->delete("/admin/properties/$property->id")->assertRedirect('/admin/properties');
    $this->delete("/admin/tradies/$company->id")->assertRedirect('/admin/tradies');
    Queue::assertNothingPushed();
});

it('validates relationships, uniqueness and protected deletes', function () {
    $this->actingAs($this->admin);
    $member = User::factory()->create(['role' => 'member']);
    $location = Suburb::factory()->create();
    Property::factory()->create(['member_user_id' => $member->id, 'suburb_id' => $location->id]);
    $this->delete("/admin/locations/$location->id")->assertSessionHasErrors('record');
    $this->delete("/admin/people/$member->id")->assertSessionHasErrors('record');
    $this->post('/admin/tradies', ['business_name' => 'Invalid', 'owner_user_id' => $member->id, 'status' => 'approved'])->assertSessionHasErrors('owner_user_id');
    $this->post('/admin/people', ['first_name' => 'Test', 'last_name' => 'Test', 'email' => $member->email, 'phone' => $member->phone, 'role' => 'member', 'status' => 'active', 'password' => 'password123'])->assertSessionHasErrors(['email', 'phone']);
    $this->post('/admin/jobs', ['property_id' => 999999, 'tradie_category_id' => 999999, 'custom_issue' => 'Test', 'urgency' => 'invalid', 'status' => 'invalid'])->assertSessionHasErrors(['property_id', 'tradie_category_id', 'urgency', 'status']);
    $this->get('/admin/not-a-resource')->assertNotFound();
});

it('searches and paginates records and removes the old public workflows', function () {
    $this->actingAs($this->admin);
    Suburb::factory()->count(22)->create();
    Suburb::factory()->create(['name' => 'FindThisPlace']);
    $this->get('/admin/locations?q=FindThisPlace')->assertInertia(fn (Assert $page) => $page->component('Crud/Index')->has('records.data', 1));
    $this->get('/admin/locations')->assertInertia(fn (Assert $page) => $page->has('records.data', 15));
    $this->get('/register/member')->assertNotFound();
    $this->postJson('/api/v1/login', [])->assertNotFound();
});
