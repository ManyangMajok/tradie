<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ManuallyAssignJobAction;
use App\Actions\Dispatch\DispatchJobAction;
use App\Enums\JobStatus;
use App\Enums\OfferStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ManualAssignRequest;
use App\Models\Job;
use App\Models\JobOffer;
use App\Models\JobStatusLog;
use App\Models\TradieCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class JobController extends Controller
{
    public function index(Request $request): Response
    {
        $jobs = Job::with(['member', 'assignedCompany', 'category', 'property.suburb'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->urgency, fn ($q) => $q->where('urgency', $request->urgency))
            ->when($request->category, fn ($q) => $q->whereHas('category', fn ($c) => $c->where('slug', $request->category)))
            ->when($request->suburb_id, fn ($q) => $q->whereHas('property', fn ($p) => $p->where('suburb_id', $request->suburb_id)))
            ->when($request->from_date, fn ($q) => $q->whereDate('submitted_at', '>=', $request->from_date))
            ->when($request->to_date, fn ($q) => $q->whereDate('submitted_at', '<=', $request->to_date))
            ->when($request->q, fn ($q) => $q->where(function ($inner) use ($request) {
                $inner->where('public_id', 'like', "%{$request->q}%")
                    ->orWhere('description', 'like', "%{$request->q}%");
            }))
            ->latest('submitted_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/Jobs/Index', [
            'jobs' => $jobs,
            'filters' => $request->only(['status', 'urgency', 'category', 'suburb_id', 'from_date', 'to_date', 'q']),
        ]);
    }

    public function show(string $publicId): Response
    {
        $job = Job::where('public_id', $publicId)
            ->with([
                'member',
                'property.suburb',
                'category',
                'issueType',
                'assignedCompany.owner',
                'offers.tradieCompany.owner',
                'images',
                'statusLogs.changedBy',
                'completionReport',
                'review',
            ])
            ->firstOrFail();

        $tradieCompanies = TradieCompany::approved()
            ->with('owner')
            ->select(['id', 'business_name', 'owner_user_id', 'rating_average'])
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->business_name,
                'owner_name' => $c->owner->first_name.' '.$c->owner->last_name,
                'rating' => $c->rating_average,
            ]);

        return Inertia::render('Admin/Jobs/Show', [
            'job' => $job,
            'tradieCompanies' => $tradieCompanies,
        ]);
    }

    public function assign(ManualAssignRequest $request, string $publicId, ManuallyAssignJobAction $action): RedirectResponse
    {
        $job = Job::where('public_id', $publicId)->firstOrFail();
        $company = TradieCompany::findOrFail($request->validated('tradie_company_id'));

        $action->execute($job, $company, $request->user(), $request->validated('note'));

        return redirect()->route('admin.jobs.show', $publicId)->with('success', 'Job manually assigned.');
    }

    public function redispatch(Request $request, string $publicId, DispatchJobAction $action): RedirectResponse
    {
        $job = Job::where('public_id', $publicId)->firstOrFail();

        DB::transaction(function () use ($job, $request): void {
            JobOffer::where('job_id', $job->id)
                ->where('status', OfferStatus::Offered)
                ->update(['status' => OfferStatus::Expired]);

            $prevStatus = $job->status;
            $job->update(['status' => JobStatus::PendingDispatch, 'requires_admin_review' => false]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::PendingDispatch,
                'changed_by_user_id' => $request->user()->id,
                'changed_by_system' => false,
                'note' => 'Admin-triggered redispatch',
            ]);
        });

        $action->execute($job->fresh());

        return redirect()->route('admin.jobs.show', $publicId)->with('success', 'Job redispatched.');
    }

    public function cancel(Request $request, string $publicId): RedirectResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $job = Job::where('public_id', $publicId)->firstOrFail();

        DB::transaction(function () use ($job, $request): void {
            $prevStatus = $job->status;
            $job->update([
                'status' => JobStatus::Cancelled,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->reason ?? 'Cancelled by admin',
            ]);

            JobStatusLog::create([
                'job_id' => $job->id,
                'from_status' => $prevStatus,
                'to_status' => JobStatus::Cancelled,
                'changed_by_user_id' => $request->user()->id,
                'changed_by_system' => false,
                'note' => $request->reason ?? 'Admin cancel',
            ]);
        });

        return redirect()->route('admin.jobs.show', $publicId)->with('success', 'Job cancelled.');
    }
}
