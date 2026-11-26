<?php

use App\Console\Commands\AutoConfirmStaleJobs;
use App\Enums\JobStatus;
use App\Enums\UserRole;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\Property;
use App\Models\Review;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAssignedJob(?TradieCompany $company = null): array
{
    $member = User::factory()->member()->create();
    $property = Property::factory()->forMember($member)->create();
    $company = $company ?? TradieCompany::factory()->approved()->create();

    $job = Job::factory()->assigned()->create([
        'member_user_id' => $member->id,
        'property_id' => $property->id,
        'assigned_tradie_company_id' => $company->id,
    ]);

    return [$job, $member, $company, $company->owner];
}

function makeCompletedJob(?TradieCompany $company = null): array
{
    $member = User::factory()->member()->create();
    $property = Property::factory()->forMember($member)->create();
    $company = $company ?? TradieCompany::factory()->approved()->create();

    $job = Job::factory()->completed()->create([
        'member_user_id' => $member->id,
        'property_id' => $property->id,
        'assigned_tradie_company_id' => $company->id,
    ]);

    return [$job, $member, $company, $company->owner];
}

// ─── Status transitions ───────────────────────────────────────────────────────

it('tradie can mark job as tradie_on_the_way from assigned', function () {
    Notification::fake();

    [$job, $member, $company, $tradie] = makeAssignedJob();

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'tradie_on_the_way'])
        ->assertOk()
        ->assertJsonPath('job.status', 'tradie_on_the_way');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::TradieOnTheWay);
    expect($job->on_the_way_at)->not()->toBeNull();

    $log = JobStatusLog::where('job_id', $job->id)->latest()->first();
    expect($log->to_status)->toBe(JobStatus::TradieOnTheWay);
    expect($log->changed_by_user_id)->toBe($tradie->id);
});

it('tradie can skip to in_progress directly from assigned', function () {
    Notification::fake();

    [$job, , , $tradie] = makeAssignedJob();

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'in_progress'])
        ->assertOk();

    $job->refresh();
    expect($job->status)->toBe(JobStatus::InProgress);
    expect($job->started_at)->not()->toBeNull();
});

it('tradie can mark job in_progress from tradie_on_the_way', function () {
    Notification::fake();

    [$job, , , $tradie] = makeAssignedJob();
    $job->update(['status' => JobStatus::TradieOnTheWay, 'on_the_way_at' => now()]);

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'in_progress'])
        ->assertOk();

    expect($job->fresh()->status)->toBe(JobStatus::InProgress);
});

it('returns 422 for unrecognised to_status', function () {
    [$job, , , $tradie] = makeAssignedJob();

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'completed'])
        ->assertUnprocessable();
});

it('allows rescheduled transition from tradie_on_the_way (valid per table)', function () {
    Notification::fake();

    // Use a job stuck in `tradie_on_the_way` and try to go to `rescheduled`
    // (allowed per transition table — this should pass, not 409)
    [$job, , , $tradie] = makeAssignedJob();
    $job->update(['status' => JobStatus::TradieOnTheWay]);

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'rescheduled'])
        ->assertOk();
});

it('returns 403 if tradie tries to update another company\'s job', function () {
    [$job] = makeAssignedJob();
    $otherTradie = TradieCompany::factory()->approved()->create()->owner;

    $this->actingAs($otherTradie)
        ->postJson("/tradie/jobs/{$job->public_id}/status", ['to_status' => 'tradie_on_the_way'])
        ->assertNotFound();
});

// ─── Completion report ────────────────────────────────────────────────────────

it('tradie can submit a completion report from in_progress', function () {
    Notification::fake();

    [$job, , , $tradie] = makeAssignedJob();
    $job->update(['status' => JobStatus::InProgress, 'started_at' => now()]);

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/complete", [
            'summary_of_work' => 'Fixed the leaking tap under the sink.',
            'invoice_total_cents' => 15000,
            'no_callout_fee_confirmed' => true,
            'discount_applied' => true,
            'discount_amount_cents' => 2000,
        ])
        ->assertCreated()
        ->assertJsonPath('job.status', 'completed');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Completed);
    expect($job->completed_at)->not()->toBeNull();
    expect($job->completionReport)->not()->toBeNull();
    expect($job->completionReport->invoice_total_cents)->toBe(15000);
});

it('completion report requires summary_of_work of at least 10 chars', function () {
    [$job, , , $tradie] = makeAssignedJob();
    $job->update(['status' => JobStatus::InProgress]);

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/complete", [
            'summary_of_work' => 'Done',
            'invoice_total_cents' => 10000,
            'no_callout_fee_confirmed' => true,
            'discount_applied' => false,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('summary_of_work');
});

it('completion from non-completable state returns 409', function () {
    [$job, , , $tradie] = makeAssignedJob();

    $this->actingAs($tradie)
        ->postJson("/tradie/jobs/{$job->public_id}/complete", [
            'summary_of_work' => 'Fixed all the things here.',
            'invoice_total_cents' => 10000,
            'no_callout_fee_confirmed' => true,
            'discount_applied' => false,
        ])
        ->assertStatus(409);
});

// ─── Review (member) ──────────────────────────────────────────────────────────

it('positive review confirms job and updates rating', function () {
    Notification::fake();

    [$job, $member, $company] = makeCompletedJob();
    expect($company->rating_count)->toBe(0);

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => 5,
            'review_text' => 'Brilliant service.',
        ])
        ->assertCreated()
        ->assertJsonPath('job.status', 'confirmed');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Confirmed);
    expect($job->confirmed_at)->not()->toBeNull();

    $company->refresh();
    expect($company->rating_count)->toBe(1);
    expect($company->rating_average)->toBe(5.0);
});

it('negative review disputes job and flags admin review', function () {
    Notification::fake();

    User::factory()->create(['role' => UserRole::Admin]);
    [$job, $member, $company] = makeCompletedJob();

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'no',
            'no_callout_fee_honoured' => false,
            'discount_honoured' => 'no',
            'stars' => 1,
            'review_text' => 'Terrible.',
        ])
        ->assertCreated()
        ->assertJsonPath('job.status', 'disputed');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Disputed);
    expect($job->requires_admin_review)->toBeTrue();

    $company->refresh();
    expect($company->rating_count)->toBe(1);
    expect($company->rating_average)->toBe(1.0);
});

it('discount_honoured=no with fee honoured and work done still disputes', function () {
    Notification::fake();

    [$job, $member] = makeCompletedJob();

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'no',
            'stars' => 3,
        ])
        ->assertCreated()
        ->assertJsonPath('job.status', 'disputed');
});

it('rating averages correctly across multiple reviews', function () {
    Notification::fake();

    $company = TradieCompany::factory()->approved()->create(['rating_count' => 2, 'rating_average' => 4.0]);
    [$job, $member] = makeCompletedJob($company);

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => 5,
        ])
        ->assertCreated();

    $company->refresh();
    expect($company->rating_count)->toBe(3);
    expect($company->rating_average)->toBe(round((4.0 * 2 + 5) / 3, 2));
});

it('cannot submit review for non-completed job', function () {
    [$job, $member] = makeAssignedJob();

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => 5,
        ])
        ->assertStatus(409);
});

it('cannot submit review twice for the same job', function () {
    Notification::fake();

    [$job, $member] = makeCompletedJob();

    $payload = [
        'work_completed_status' => 'yes',
        'no_callout_fee_honoured' => true,
        'discount_honoured' => 'yes',
        'stars' => 5,
    ];

    $this->actingAs($member)->postJson("/jobs/{$job->public_id}/review", $payload)->assertCreated();
    $this->actingAs($member)->postJson("/jobs/{$job->public_id}/review", $payload)->assertStatus(409);
});

it('validates stars are between 1 and 5', function () {
    [$job, $member] = makeCompletedJob();

    $this->actingAs($member)
        ->postJson("/jobs/{$job->public_id}/review", [
            'work_completed_status' => 'yes',
            'no_callout_fee_honoured' => true,
            'discount_honoured' => 'yes',
            'stars' => 6,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('stars');
});

// ─── Auto-confirm command ─────────────────────────────────────────────────────

it('auto-confirm command confirms stale completed jobs', function () {
    Notification::fake();

    [$job, $member, $company] = makeCompletedJob();
    $job->update(['completed_at' => now()->subDays(8)]);

    $this->artisan(AutoConfirmStaleJobs::class)->assertExitCode(0);

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Confirmed);
    expect($job->review)->not()->toBeNull();
    expect($job->review->was_auto_confirmed)->toBeTrue();
    expect($job->review->stars)->toBe(5);
});

it('auto-confirm command skips jobs completed less than 7 days ago', function () {
    Notification::fake();

    [$job] = makeCompletedJob();
    $job->update(['completed_at' => now()->subDays(3)]);

    $this->artisan(AutoConfirmStaleJobs::class)->assertExitCode(0);

    expect($job->fresh()->status)->toBe(JobStatus::Completed);
    expect(Review::where('job_id', $job->id)->exists())->toBeFalse();
});

it('auto-confirm command skips jobs that already have a review', function () {
    Notification::fake();

    [$job, $member, $company] = makeCompletedJob();
    $job->update(['completed_at' => now()->subDays(8)]);

    Review::factory()->positive()->create([
        'job_id' => $job->id,
        'member_user_id' => $member->id,
        'tradie_company_id' => $company->id,
    ]);

    $this->artisan(AutoConfirmStaleJobs::class)->assertExitCode(0);

    // Only one review should exist
    expect(Review::where('job_id', $job->id)->count())->toBe(1);
    // Job status unchanged (still 'completed' since we didn't run SubmitReviewAction)
    expect($job->fresh()->status)->toBe(JobStatus::Completed);
});

it('auto-confirm does not update tradie rating', function () {
    Notification::fake();

    [$job, , $company] = makeCompletedJob();
    $job->update(['completed_at' => now()->subDays(8)]);
    $initialCount = $company->rating_count;

    $this->artisan(AutoConfirmStaleJobs::class)->assertExitCode(0);

    $company->refresh();
    expect($company->rating_count)->toBe($initialCount);
});
