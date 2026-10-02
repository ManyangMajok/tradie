<?php

namespace App\Http\Controllers\Member;

use App\Actions\Dispatch\SelectTradieAction;
use App\Actions\Job\SubmitReviewAction;
use App\Enums\JobStatus;
use App\Enums\Urgency;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreChosenJobRequest;
use App\Http\Requests\Member\StoreReviewRequest;
use App\Models\IssueType;
use App\Models\Job;
use App\Models\JobImage;
use App\Models\JobStatusLog;
use App\Models\Property;
use App\Models\TradieCategory;
use App\Models\User;
use App\Notifications\AdminJobDisputed;
use App\Notifications\TradieJobDisputed;
use App\Services\AvailableTradies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JobController extends Controller
{
    public function create(Request $request): Response
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

        return Inertia::render('Member/Jobs/Wizard', [
            'properties' => $properties,
            'categories' => $categories,
            'issue_types' => $issueTypes,
        ]);
    }

    public function store(StoreChosenJobRequest $request, SelectTradieAction $select): JsonResponse|RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // Duplicate-submission guard: same member + property + category within N seconds
        $dedup = config('dispatch.duplicate_submission_seconds', 60);
        $existing = Job::where('member_user_id', $user->id)
            ->where('property_id', $data['property_id'])
            ->where('tradie_category_id', $data['tradie_category_id'])
            ->where('submitted_at', '>=', now()->subSeconds($dedup))
            ->whereNotIn('status', [JobStatus::Cancelled->value, JobStatus::Confirmed->value])
            ->first();

        if ($existing) {
            if ($existing->selected_tradie_company_id !== (int) $data['selected_tradie_company_id']) {
                throw ValidationException::withMessages([
                    'selected_tradie_company_id' => 'You already submitted a request for this property and trade. Open that request to check its status before choosing again.',
                ]);
            }

            return $request->expectsJson()
                ? response()->json(['job' => $existing->only(['id', 'public_id']), 'public_id' => $existing->public_id])
                : redirect()->route('member.jobs.show', $existing->public_id);
        }

        $job = DB::transaction(function () use ($data, $user, $select): Job {
            $job = Job::create([
                'member_user_id' => $user->id,
                'property_id' => $data['property_id'],
                'tradie_category_id' => $data['tradie_category_id'],
                'issue_type_id' => $data['issue_type_id'] ?? null,
                'custom_issue' => $data['custom_issue'] ?? null,
                'urgency' => $data['urgency'],
                'description' => $data['description'],
                'best_contact_time' => $data['best_contact_time'] ?? null,
                'status' => JobStatus::PendingDispatch,
                'submitted_at' => now(),
            ]);

            // Attach pre-uploaded images
            if (! empty($data['image_ids'])) {
                JobImage::whereIn('id', $data['image_ids'])
                    ->where('uploaded_by_user_id', $user->id)
                    ->whereNull('job_id')
                    ->update(['job_id' => $job->id]);
            }

            $select->execute($job, (int) $data['selected_tradie_company_id']);

            return $job;
        });

        if (! $request->expectsJson()) {
            return redirect()->route('member.jobs.show', $job->public_id);
        }

        return response()->json([
            'job' => $job->only(['id', 'public_id', 'status']),
            'public_id' => $job->public_id,
        ], 201);
    }

    public function show(Request $request, string $publicId, AvailableTradies $available): Response
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

        return Inertia::render('Member/Jobs/Show', [
            'job' => $job,
            'available_tradies' => $job->selected_tradie_company_id && $job->status === JobStatus::PendingDispatch
                ? $available->forJob($job) : [],
        ]);
    }

    public function availableTradies(Request $request, AvailableTradies $available): JsonResponse
    {
        $data = $request->validate([
            'property_id' => ['required', 'integer', Rule::exists('properties', 'id')->where('member_user_id', $request->user()->id)->whereNull('deleted_at')],
            'tradie_category_id' => ['required', 'integer', Rule::exists('tradie_categories', 'id')->where('is_active', true)],
            'urgency' => ['required', Rule::enum(Urgency::class)],
        ]);
        $property = Property::with('suburb')->findOrFail($data['property_id']);
        $draft = new Job($data);
        $draft->id = 0;
        $draft->setRelation('property', $property);

        return response()->json(['location' => $property->suburb->name, 'tradies' => $available->forJob($draft)]);
    }

    public function chooseTradie(Request $request, string $publicId, SelectTradieAction $select): RedirectResponse
    {
        $job = Job::where('public_id', $publicId)->where('member_user_id', $request->user()->id)->firstOrFail();
        abort_unless($job->selected_tradie_company_id !== null, 409, 'This job does not use member selection.');
        $data = $request->validate(['selected_tradie_company_id' => ['required', 'integer', 'exists:tradie_companies,id']]);
        $select->execute($job, (int) $data['selected_tradie_company_id']);

        return redirect()->route('member.jobs.show', $job->public_id);
    }

    public function index(Request $request): Response
    {
        $jobs = Job::where('member_user_id', $request->user()->id)
            ->with(['category', 'property.suburb', 'assignedCompany'])
            ->latest('submitted_at')
            ->paginate(20);

        return Inertia::render('Member/Jobs/Index', ['jobs' => $jobs]);
    }

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

        return response()->json(['job' => $job->fresh()->only(['id', 'public_id', 'status'])]);
    }

    public function review(StoreReviewRequest $request, string $publicId, SubmitReviewAction $action): JsonResponse
    {
        $job = Job::where('public_id', $publicId)
            ->where('member_user_id', $request->user()->id)
            ->firstOrFail();

        abort_if($job->status !== JobStatus::Completed, 409, 'Review can only be submitted for completed jobs.');
        abort_if($job->review()->exists(), 409, 'A review has already been submitted for this job.');

        $review = $action->execute($job, $request->user(), $request->validated());

        $job->refresh();

        if ($job->status === JobStatus::Disputed) {
            $job->assignedCompany->owner->notify(new TradieJobDisputed($job, $review));
            User::where('role', UserRole::Admin)->get()->each(
                fn (User $admin) => $admin->notify(new AdminJobDisputed($job, $review))
            );
        }

        return response()->json([
            'review' => $review,
            'job' => $job->only(['id', 'public_id', 'status']),
        ], 201);
    }
}
