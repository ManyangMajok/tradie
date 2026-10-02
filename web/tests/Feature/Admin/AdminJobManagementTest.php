<?php

use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAdminAndJob(JobStatus $status = JobStatus::PendingDispatch): array
{
    $admin = User::factory()->admin()->create();
    $member = User::factory()->member()->create();
    $job = Job::factory()->state(['status' => $status, 'member_user_id' => $member->id])->create();

    return [$admin, $job, $member];
}

// ─── Jobs index ──────────────────────────────────────────────────────────────

it('shows jobs list to admin', function () {
    [$admin] = makeAdminAndJob();

    $this->actingAs($admin)->get('/admin/jobs')->assertStatus(200);
});

it('blocks non-admins from jobs list', function () {
    $member = User::factory()->member()->create();

    $this->actingAs($member)->get('/admin/jobs')->assertStatus(403);
});

it('filters jobs by status', function () {
    [$admin, $job] = makeAdminAndJob(JobStatus::Disputed);

    $this->actingAs($admin)
        ->get('/admin/jobs?status=disputed')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Jobs/Index')
            ->where('jobs.data.0.public_id', $job->public_id)
        );
});

// ─── Job show ────────────────────────────────────────────────────────────────

it('shows job detail page to admin', function () {
    [$admin, $job] = makeAdminAndJob();

    $this->actingAs($admin)
        ->get("/admin/jobs/{$job->public_id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Admin/Jobs/Show'));
});

// ─── Manual assign ───────────────────────────────────────────────────────────

it('admin can manually assign a pending job', function () {
    [$admin, $job] = makeAdminAndJob(JobStatus::PendingDispatch);
    $company = TradieCompany::factory()->approved()->create();

    $this->actingAs($admin)
        ->post("/admin/jobs/{$job->public_id}/assign", [
            'tradie_company_id' => $company->id,
            'note' => 'Per phone call',
        ])
        ->assertRedirect("/admin/jobs/{$job->public_id}");

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Assigned);
    expect($job->assigned_tradie_company_id)->toBe($company->id);
    expect($job->requires_admin_review)->toBeFalse();

    $log = JobStatusLog::where('job_id', $job->id)->latest('id')->first();
    expect($log->to_status)->toBe(JobStatus::Assigned);
    expect($log->note)->toContain('Admin override');
    expect($log->note)->toContain('Per phone call');
});

it('rejects assign without a valid tradie company', function () {
    [$admin, $job] = makeAdminAndJob();

    $this->actingAs($admin)
        ->post("/admin/jobs/{$job->public_id}/assign", ['tradie_company_id' => 9999])
        ->assertSessionHasErrors('tradie_company_id');
});

// ─── Redispatch ──────────────────────────────────────────────────────────────

it('admin can redispatch a job and pending offers are expired', function () {
    [$admin, $job] = makeAdminAndJob(JobStatus::Offered);
    $company = TradieCompany::factory()->approved()->create();

    JobOffer::factory()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'status' => OfferStatus::Offered,
        'round' => 1,
        'rank_in_round' => 1,
        'score' => 80,
        'offered_at' => now(),
        'expires_at' => now()->addHour(),
    ]);

    $this->actingAs($admin)
        ->post("/admin/jobs/{$job->public_id}/redispatch")
        ->assertRedirect("/admin/jobs/{$job->public_id}");

    expect(JobOffer::where('job_id', $job->id)->where('status', OfferStatus::Offered)->count())->toBe(0);

    // The admin action creates the first new log; the dispatch engine may append another.
    $adminLog = JobStatusLog::where('job_id', $job->id)
        ->where('changed_by_system', false)
        ->latest('id')
        ->first();
    expect($adminLog->note)->toContain('redispatch');
});

// ─── Cancel ──────────────────────────────────────────────────────────────────

it('admin can cancel a job in any status', function () {
    foreach ([JobStatus::PendingDispatch, JobStatus::Assigned, JobStatus::InProgress, JobStatus::Completed] as $status) {
        [$admin, $job] = makeAdminAndJob($status);

        $this->actingAs($admin)
            ->post("/admin/jobs/{$job->public_id}/cancel", ['reason' => 'Test cancel'])
            ->assertRedirect("/admin/jobs/{$job->public_id}");

        $job->refresh();
        expect($job->status)->toBe(JobStatus::Cancelled);
        expect($job->cancellation_reason)->toContain('Test cancel');
        expect($job->cancelled_at)->not->toBeNull();
    }
});

it('cancel logs the status change with the admin user', function () {
    [$admin, $job] = makeAdminAndJob(JobStatus::Assigned);

    $this->actingAs($admin)
        ->post("/admin/jobs/{$job->public_id}/cancel", ['reason' => 'Admin override'])
        ->assertRedirect();

    $log = JobStatusLog::where('job_id', $job->id)->latest('id')->first();
    expect($log->to_status)->toBe(JobStatus::Cancelled);
    expect($log->changed_by_user_id)->toBe($admin->id);
    expect($log->changed_by_system)->toBeFalse();
});
