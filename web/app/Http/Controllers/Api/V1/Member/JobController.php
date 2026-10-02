<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Actions\Dispatch\SelectTradieAction;
use App\Actions\Job\SubmitReviewAction;
use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreChosenJobRequest;
use App\Http\Requests\Member\StoreReviewRequest;
use App\Models\IssueType;
use App\Models\Job;
use App\Models\JobStatusLog;
use App\Models\TradieCategory;
use App\Services\AvailableTradies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    /**
     * GET /api/v1/member/jobs?status=active|completed
     */
    public function index(Request $request): JsonResponse
    {
        $query = Job::where('member_user_id', $request->user()->id)
            ->with(['category', 'property.suburb', 'assignedCompany']);

        $status = $request->query('status');

        if ($status === 'active') {
            $query->whereNotIn('status', [
                JobStatus::Confirmed->value,
                JobStatus::Cancelled->value,
            ]);
        } elseif ($status === 'completed') {
            $query->whereIn('status', [
                JobStatus::Completed->value,
                JobStatus::Confirmed->value,
                JobStatus::Disputed->value,
                JobStatus::Cancelled->value,
            ]);
        }

        $jobs = $query->latest('submitted_at')->paginate(20);

        return response()->json($jobs);
    }

    /**
     * GET /api/v1/member/jobs/create
     *
     * Returns reference data for the job submission wizard.
     */
    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        $properties = $user->properties()
            ->with('suburb')
            ->whereNull('deleted_at')
            ->get(['id', 'label', 'address_line_1', 'suburb_id']);

        $categories = TradieCategory::where('is_active', true)
            ->get(['id', 'name', 'slug']);

        $issueTypes = IssueType::where('is_active', true)
            ->get(['id', 'tradie_category_id', 'name']);

        return response()->json([
            'properties' => $properties,
            'categories' => $categories,
            'issue_types' => $issueTypes,
        ]);
    }

    /**
     * POST /api/v1/jobs
     */
    public function store(StoreChosenJobRequest $request, SelectTradieAction $select): JsonResponse
    {
        $request->headers->set('Accept', 'application/json');

        return app(\App\Http\Controllers\Member\JobController::class)->store($request, $select);
    }

    public function availableTradies(Request $request, AvailableTradies $available): JsonResponse
    {
        return app(\App\Http\Controllers\Member\JobController::class)->availableTradies($request, $available);
    }

    public function chooseTradie(Request $request, string $publicId, SelectTradieAction $select): JsonResponse
    {
        $job = Job::where('public_id', $publicId)->where('member_user_id', $request->user()->id)->firstOrFail();
        abort_unless($job->selected_tradie_company_id !== null, 409);
        $data = $request->validate(['selected_tradie_company_id' => ['required', 'integer', 'exists:tradie_companies,id']]);
        $select->execute($job, (int) $data['selected_tradie_company_id']);

        return response()->json(['data' => $job, 'available_tradies' => $job->selected_tradie_company_id && $job->status === JobStatus::PendingDispatch ? app(AvailableTradies::class)->forJob($job) : []]);
    }

    /**
     * GET /api/v1/member/jobs/{publicId}
     */
    public function show(Request $request, string $publicId): JsonResponse
    {
        $job = Job::where('public_id', $publicId)
            ->where('member_user_id', $request->user()->id)
            ->with([
                'property.suburb',
                'category',
                'issueType',
                'images',
                'statusLogs' => fn ($q) => $q->orderBy('created_at'),
                'assignedCompany',
                'selectedCompany:id,business_name,rating_average,rating_count',
                'completionReport',
                'review',
            ])
            ->firstOrFail();

        return response()->json(['data' => $job, 'available_tradies' => $job->selected_tradie_company_id && $job->status === JobStatus::PendingDispatch ? app(AvailableTradies::class)->forJob($job) : []]);
    }

    /**
     * POST /api/v1/member/jobs/{publicId}/cancel
     */
    public function cancel(Request $request, string $publicId): JsonResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $job = Job::where('public_id', $publicId)
            ->where('member_user_id', $request->user()->id)
            ->firstOrFail();

        $cancellable = [
            JobStatus::PendingDispatch,
            JobStatus::Offered,
            JobStatus::Assigned,
            JobStatus::TradieOnTheWay,
            JobStatus::Rescheduled,
        ];

        abort_unless(in_array($job->status, $cancellable), 409, 'Job cannot be cancelled at this stage.');

        DB::transaction(function () use ($job, $request): void {
            $prevStatus = $job->status;
            $job->update([
                'status' => JobStatus::Cancelled,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->input('reason'),
            ]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::Cancelled,
                'changed_by_user_id' => $request->user()->id,
                'changed_by_system' => false,
                'note' => $request->input('reason'),
            ]);
        });

        return response()->json([
            'job' => $job->fresh()->only(['id', 'public_id', 'status']),
        ]);
    }

    /**
     * POST /api/v1/member/jobs/{publicId}/review
     */
    public function review(StoreReviewRequest $request, string $publicId, SubmitReviewAction $action): JsonResponse
    {
        $job = Job::where('public_id', $publicId)
            ->where('member_user_id', $request->user()->id)
            ->firstOrFail();

        abort_if($job->status !== JobStatus::Completed, 409, 'Review can only be submitted for completed jobs.');
        abort_if($job->review()->exists(), 409, 'A review has already been submitted for this job.');

        $review = $action->execute($job, $request->user(), $request->validated());

        return response()->json([
            'review' => $review,
            'job' => $job->fresh()->only(['id', 'public_id', 'status']),
        ], 201);
    }
}
