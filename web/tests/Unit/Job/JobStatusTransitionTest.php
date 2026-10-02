<?php

use App\Enums\JobStatus;
use App\Exceptions\Job\InvalidStatusTransitionException;
use App\Services\JobStatusTransition;

$svc = new JobStatusTransition;

// ─── Allowed transitions ─────────────────────────────────────────────────────

it('allows pending_dispatch → offered', function () use ($svc) {
    $svc->assertAllowed(JobStatus::PendingDispatch, JobStatus::Offered);
})->throwsNoExceptions();

it('allows assigned → tradie_on_the_way', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Assigned, JobStatus::TradieOnTheWay);
})->throwsNoExceptions();

it('allows assigned → in_progress', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Assigned, JobStatus::InProgress);
})->throwsNoExceptions();

it('allows tradie_on_the_way → in_progress', function () use ($svc) {
    $svc->assertAllowed(JobStatus::TradieOnTheWay, JobStatus::InProgress);
})->throwsNoExceptions();

it('allows in_progress → completed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::InProgress, JobStatus::Completed);
})->throwsNoExceptions();

it('allows awaiting_client_response → completed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::AwaitingClientResponse, JobStatus::Completed);
})->throwsNoExceptions();

it('allows completed → confirmed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Completed, JobStatus::Confirmed);
})->throwsNoExceptions();

it('allows completed → disputed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Completed, JobStatus::Disputed);
})->throwsNoExceptions();

// ─── Disallowed transitions ──────────────────────────────────────────────────

it('throws on pending_dispatch → completed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::PendingDispatch, JobStatus::Completed);
})->throws(InvalidStatusTransitionException::class);

it('throws on assigned → confirmed', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Assigned, JobStatus::Confirmed);
})->throws(InvalidStatusTransitionException::class);

it('throws on confirmed → disputed (terminal)', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Confirmed, JobStatus::Disputed);
})->throws(InvalidStatusTransitionException::class);

it('throws on cancelled → assigned (terminal)', function () use ($svc) {
    $svc->assertAllowed(JobStatus::Cancelled, JobStatus::Assigned);
})->throws(InvalidStatusTransitionException::class);

it('includes status names in the exception message', function () use ($svc) {
    try {
        $svc->assertAllowed(JobStatus::Confirmed, JobStatus::InProgress);
        $this->fail('Expected exception');
    } catch (InvalidStatusTransitionException $e) {
        expect($e->getMessage())
            ->toContain('confirmed')
            ->toContain('in_progress');
    }
});
