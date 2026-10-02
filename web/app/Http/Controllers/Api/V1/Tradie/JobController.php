<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Actions\Job\SubmitCompletionReportAction;
use App\Enums\JobStatus;
use App\Exceptions\Job\InvalidStatusTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tradie\StoreCompletionReportRequest;
use App\Http\Requests\Tradie\UpdateJobStatusRequest;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Services\JobStatusTransition;
use App\Traits\FormatsJobResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    use FormatsJobResponse;

    public function __construct(private readonly JobStatusTransition $statusTransition) {}

    /**
     * GET /api/v1/tradie/jobs?status=active|completed
     */
    public function index(Request $request): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $query = Job::where('assigned_tradie_company_id', $company->id)
            ->with(['category', 'property.suburb']);

        $status = $request->query('status');

        if ($status === 'active') {
            $query->whereIn('status', [
                JobStatus::Assigned->value,
                JobStatus::TradieOnTheWay->value,
                JobStatus::InProgress->value,
                JobStatus::AwaitingClientResponse->value,
                JobStatus::Rescheduled->value,
            ]);
        } elseif ($status === 'completed') {
            $query->whereIn('status', [
                JobStatus::Completed->value,
                JobStatus::Confirmed->value,
                JobStatus::Disputed->value,
                JobStatus::Cancelled->value,
            ]);
        }
        // else: all statuses

        $jobs = $query->latest('assigned_at')->paginate(20);

        $jobs->getCollection()->transform(fn (Job $job) => $this->formatJob($job));

        return response()->json($jobs);
    }

    /**
     * GET /api/v1/tradie/jobs/{publicId}
     */
    public function show(Request $request, string $publicId): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $job = Job::where('public_id', $publicId)
            ->where('assigned_tradie_company_id', $company->id)
            ->with([
                'category',
                'issueType',
                'property.suburb',
                'member:id,first_name,last_name,phone',
                'images',
                'statusLogs' => fn ($q) => $q->orderBy('created_at'),
                'completionReport',
                'review',
            ])
            ->firstOrFail();

        return response()->json(['data' => $this->formatJob($job)]);
    }

    /**
     * POST /api/v1/tradie/jobs/{publicId}/status
     */
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

        return response()->json([
            'job' => $job->fresh()->only(['id', 'public_id', 'status']),
        ]);
    }

    /**
     * POST /api/v1/tradie/jobs/{publicId}/complete
     */
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

        return response()->json([
            'report' => $report,
            'job' => $job->fresh()->only(['id', 'public_id', 'status']),
        ], 201);
    }
}
