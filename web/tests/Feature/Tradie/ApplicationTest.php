<?php

use App\Enums\TradieCompanyStatus;
use App\Enums\UserRole;
use App\Models\Suburb;
use App\Models\TradieCategory;
use App\Models\User;
use App\Notifications\AdminNewTradieApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Notification::fake();
});

it('shows the tradie registration step 1 page', function () {
    $this->get('/register/tradie/step-1')->assertStatus(200);
});

it('stores step 1 data in session and redirects to step 2', function () {
    $this->post('/register/tradie/step-1', [
        'first_name' => 'Jake',
        'last_name' => 'Plumber',
        'email' => 'jake@example.com',
        'phone' => '+61412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
        'business_name' => 'Jake\'s Plumbing',
        'abn' => '12345678901',
    ])->assertRedirect('/register/tradie/step-2');

    expect(session('tradie_registration.step1.email'))->toBe('jake@example.com');
});

it('rejects step 1 with a duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->post('/register/tradie/step-1', [
        'first_name' => 'Jake',
        'last_name' => 'Plumber',
        'email' => 'taken@example.com',
        'phone' => '+61412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
        'business_name' => 'Jake\'s Plumbing',
    ])->assertSessionHasErrors('email');
});

it('uploads a document and returns its path', function () {
    $file = UploadedFile::fake()->create('licence.pdf', 512, 'application/pdf');

    $response = $this->post('/register/tradie/upload-doc', ['file' => $file]);

    $response->assertOk()->assertJsonStructure(['path']);
    $path = $response->json('path');
    Storage::disk('local')->assertExists($path);
});

it('completes the full 4-step application and creates user + company', function () {
    $category = TradieCategory::factory()->create();
    $suburb = Suburb::factory()->create();

    // Step 1
    $this->post('/register/tradie/step-1', [
        'first_name' => 'Jake',
        'last_name' => 'Plumber',
        'email' => 'jake@example.com',
        'phone' => '+61412345678',
        'password' => 'password',
        'password_confirmation' => 'password',
        'business_name' => 'Jake\'s Plumbing',
    ]);

    // Step 2
    $this->post('/register/tradie/step-2', [
        'category_ids' => [$category->id],
        'suburb_ids' => [$suburb->id],
    ]);

    // Upload docs (fake paths)
    session()->put('tradie_registration.step3', [
        'licence_number' => 'PL-1234',
        'licence_state' => 'WA',
        'licence_expires_on' => now()->addYear()->toDateString(),
        'insurance_expires_on' => now()->addYear()->toDateString(),
        'licence_document_path' => 'tradie_docs/fake-licence.pdf',
        'insurance_document_path' => 'tradie_docs/fake-insurance.pdf',
    ]);

    // Step 4 (final submit)
    $this->post('/register/tradie/step-4', [
        'agreed_terms' => true,
        'agreed_conduct' => true,
        'agreed_background_check' => true,
    ])->assertRedirect('/tradie/pending-approval');

    // User created
    $this->assertDatabaseHas('users', [
        'email' => 'jake@example.com',
        'role' => UserRole::Tradie->value,
    ]);

    // Company created as pending_review
    $this->assertDatabaseHas('tradie_companies', [
        'business_name' => 'Jake\'s Plumbing',
        'status' => TradieCompanyStatus::PendingReview->value,
    ]);

    // Categories + service areas
    $user = User::where('email', 'jake@example.com')->first();
    expect($user->tradieCompany->categories)->toHaveCount(1);
    expect($user->tradieCompany->serviceAreas)->toHaveCount(1);

    // Default availability created (Mon–Fri = 5 rows)
    expect($user->tradieCompany->availability)->toHaveCount(5);

    // Admin notified
    Notification::assertSentOnDemand(AdminNewTradieApplication::class);

    // User is logged in
    $this->assertAuthenticatedAs($user);
});

it('redirects to step 1 if steps were skipped', function () {
    $this->get('/register/tradie/step-2')->assertRedirect('/register/tradie/step-1');
    $this->get('/register/tradie/step-3')->assertRedirect('/register/tradie/step-2');
    $this->get('/register/tradie/step-4')->assertRedirect('/register/tradie/step-3');
});
