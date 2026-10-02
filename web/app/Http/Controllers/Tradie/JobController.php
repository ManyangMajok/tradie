<?php

namespace App\Http\Controllers\Tradie;

use App\Actions\Job\SubmitCompletionReportAction;
use App\Enums\JobStatus;
use App\Exceptions\Job\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tradie\StoreCompletionReportRequest;
use App\Http\Requests\Tradie\UpdateJobStatusRequest;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Notifications\MemberJobCompletedPromptReview;
use App\Notifications\MemberTradieOnTheWay;
use App\Services\JobStatusTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class JobController extends Controller
{
    public function __construct(private readonly JobStatusTransition $statusTransition) {}

    public function index(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $jobs = Job::where('assigned_tradie_company_id', $company->id)
            ->with(['category', 'property.suburb'])
            ->whereIn('status', [
                JobStatus::Assigned->value,
                JobStatus::TradieOnTheWay->value,
                JobStatus::InProgress->value,
                JobStatus::AwaitingClientResponse->value,
                JobStatus::Rescheduled->value,
                JobStatus::Completed->value,
                JobStatus::Confirmed->value,
                JobStatus::Disputed->value,
            ])
            ->latest('assigned_at')
            ->paginate(20);

        return Inertia::render('Tradie/Jobs/Index', ['jobs' => $jobs]);
    }

    public function show(Request $request, string $publicId): Response
    {
        $company = $request->user()->tradieCompany;

        $job = Job::where('public_id', $publicId)
            ->where('assigned_tradie_company_id', $company->id)
            ->with([
                'category',
                'property.suburb',
                'member',
                'images',
                'statusLogs' => fn ($q) => $q->orderBy('created_at'),
                'completionReport',
                'review',
            ])
            ->firstOrFail();

        return Inertia::render('Tradie/Jobs/Show', ['job' => $job]);
    }

    public function updateStatus(UpdateJobStatusRequest $request, string $publicId): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $job = Job::where('public_id', $publicId)
            ->where('assigned_tradie_company_id', $company->id)
            ->firstOrFail();

        $toStatus = JobStatus::from($request->validated('to_status'));

        try {
            DB::transaction(function () use ($job, $toStatus, $request): void {
                $this->statusTransition->assertAllowed($job->status, $toStatus);

                $prevStatus = $job->status;
                $updates = ['status' => $toStatus];

                if ($toStatus === JobStatus::TradieOnTheWay) {
                    $updates['on_the_way_at'] = now();
                } elseif ($toStatus === JobStatus::InProgress) {
                    $updates['started_at'] = now();
                }

                $job->update($updates);

                JobStatusLog::create([
                    'job_id' => $job->id,
                    'from_status' => $prevStatus,
                    'to_status' => $toStatus,
                    'changed_by_user_id' => $request->user()->id,
                    'changed_by_system' => false,
                ]);
            });
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        if ($toStatus === JobStatus::TradieOnTheWay) {
            $job->member->notify(new MemberTradieOnTheWay($job->fresh()));
        }

        return response()->json(['job' => $job->fresh()->only(['id', 'public_id', 'status'])]);
    }

    public function completeForm(Request $request, string $publicId): Response
    {
        $company = $request->user()->tradieCompany;

        $job = Job::where('public_id', $publicId)
            ->where('assigned_tradie_company_id', $company->id)
            ->whereIn('status', [JobStatus::InProgress->value, JobStatus::AwaitingClientResponse->value])
            ->with(['category', 'property.suburb'])
            ->firstOrFail();

        return Inertia::render('Tradie/Jobs/Complete', ['job' => $job]);
    }

    public function complete(
        StoreCompletionReportRequest $request,
        string $publicId,
        SubmitCompletionReportAction $action
    ): JsonResponse {
        $company = $request->user()->tradieCompany;

        $job = Job::where('public_id', $publicId)
            ->where('assigned_tradie_company_id', $company->id)
            ->firstOrFail();

        try {
            $report = $action->execute($job, $request->user(), $request->validated());
        } catch (InvalidStatusTransitionException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        $job->member->notify(new MemberJobCompletedPromptReview($job->fresh()));

        return response()->json([
            'report' => $report,
            'job' => $job->fresh()->only(['id', 'public_id', 'status']),
        ], 201);
    }
}
