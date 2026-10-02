<?php

use App\Enums\JobStatus;
use App\Enums\TradieCompanyStatus;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\MemberCredit;
use App\Models\Review;
use App\Models\TradieCompany;
use App\Models\User;
use App\Notifications\TradieDisputeResolvedWarning;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(fn () => Notification::fake());

function makeDisputedJob(): array
{
    $admin = User::factory()->admin()->create();
    $member = User::factory()->member()->create();
    $company = TradieCompany::factory()->approved()->create();

    $job = Job::factory()->disputed()->create([
        'member_user_id' => $member->id,
        'assigned_tradie_company_id' => $company->id,
    ]);

    Review::factory()->create([
        'job_id' => $job->id,
        'tradie_company_id' => $company->id,
        'member_user_id' => $member->id,
        'stars' => 1,
        'work_completed_status' => 'incomplete',
        'no_callout_fee_honoured' => false,
    ]);

    return [$admin, $job, $member, $company];
}

// ─── Disputes index ──────────────────────────────────────────────────────────

it('shows disputes queue to admin', function () {
    [$admin] = makeDisputedJob();

    $this->actingAs($admin)->get('/admin/disputes')->assertStatus(200);
});

it('blocks non-admins from disputes queue', function () {
    $member = User::factory()->member()->create();

    $this->actingAs($member)->get('/admin/disputes')->assertStatus(403);
});

// ─── tradie_at_fault resolution ──────────────────────────────────────────────

it('resolves dispute as tradie_at_fault — job cancelled', function () {
    [$admin, $job] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'tradie_at_fault',
            'action_on_tradie' => 'none',
        ])
        ->assertRedirect('/admin/disputes');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Cancelled);
    expect($job->requires_admin_review)->toBeFalse();
});

// ─── member_at_fault resolution ──────────────────────────────────────────────

it('resolves dispute as member_at_fault — job confirmed', function () {
    [$admin, $job] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'member_at_fault',
            'action_on_tradie' => 'none',
        ])
        ->assertRedirect('/admin/disputes');

    $job->refresh();
    expect($job->status)->toBe(JobStatus::Confirmed);
});

// ─── Tradie action — warn ────────────────────────────────────────────────────

it('warn action notifies the tradie owner', function () {
    [$admin, $job, $member, $company] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'tradie_at_fault',
            'action_on_tradie' => 'warn',
        ])
        ->assertRedirect();

    Notification::assertSentTo(
        $company->owner,
        TradieDisputeResolvedWarning::class,
        fn ($n) => $n->actionOnTradie === 'warn'
    );
});

// ─── Tradie action — suspend_7d ──────────────────────────────────────────────

it('suspend_7d suspends the tradie company and notifies', function () {
    [$admin, $job, $member, $company] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'tradie_at_fault',
            'action_on_tradie' => 'suspend_7d',
        ])
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Suspended);
    expect($company->suspended_reason)->toContain('expires');

    Notification::assertSentTo($company->owner, TradieDisputeResolvedWarning::class);
});

// ─── Tradie action — suspend_indefinite ──────────────────────────────────────

it('suspend_indefinite suspends tradie with indefinite reason', function () {
    [$admin, $job, $member, $company] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'tradie_at_fault',
            'action_on_tradie' => 'suspend_indefinite',
        ])
        ->assertRedirect();

    $company->refresh();
    expect($company->status)->toBe(TradieCompanyStatus::Suspended);
    expect($company->suspended_reason)->toContain('indefinite');
});

// ─── Member credit ───────────────────────────────────────────────────────────

it('issues member credit when requested', function () {
    [$admin, $job, $member] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'tradie_at_fault',
            'action_on_tradie' => 'none',
            'issue_member_credit_cents' => 5000,
            'note' => 'Callout fee charged incorrectly.',
        ])
        ->assertRedirect();

    $credit = MemberCredit::where('member_user_id', $member->id)->first();
    expect($credit)->not->toBeNull();
    expect($credit->amount_cents)->toBe(5000);
    expect($credit->reason)->toContain($job->public_id);
});

it('does not create credit when amount is zero', function () {
    [$admin, $job, $member] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'no_fault',
            'action_on_tradie' => 'none',
            'issue_member_credit_cents' => 0,
        ])
        ->assertRedirect();

    expect(MemberCredit::where('member_user_id', $member->id)->count())->toBe(0);
});

// ─── Resolution logs ─────────────────────────────────────────────────────────

it('logs the resolution in job_status_logs', function () {
    [$admin, $job] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'no_fault',
            'action_on_tradie' => 'none',
            'note' => 'Both parties satisfied.',
        ])
        ->assertRedirect();

    $log = JobStatusLog::where('job_id', $job->id)->latest('id')->first();
    $note = json_decode($log->note, true);

    expect($note['resolution'])->toBe('no_fault');
    expect($note['admin_note'])->toBe('Both parties satisfied.');
});

// ─── Guard: only disputed jobs ────────────────────────────────────────────────

it('cannot resolve a non-disputed job', function () {
    $admin = User::factory()->admin()->create();
    $job = Job::factory()->state(['status' => JobStatus::Confirmed])->create();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'no_fault',
            'action_on_tradie' => 'none',
        ])
        ->assertSessionHas('error');
});

// ─── Validation ──────────────────────────────────────────────────────────────

it('rejects invalid resolution value', function () {
    [$admin, $job] = makeDisputedJob();

    $this->actingAs($admin)
        ->post("/admin/disputes/{$job->id}/resolve", [
            'resolution' => 'made_up_value',
            'action_on_tradie' => 'none',
        ])
        ->assertSessionHasErrors('resolution');
});
