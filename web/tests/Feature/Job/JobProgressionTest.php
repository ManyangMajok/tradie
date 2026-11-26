<?php

use App\Console\Commands\AutoConfirmStaleJobs;
use App\Enums\JobStatus;
use App\Models\Job;
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
