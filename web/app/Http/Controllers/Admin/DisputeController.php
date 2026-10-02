<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\ResolveDisputeAction;
use App\Enums\JobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResolveDisputeRequest;
use App\Models\Job;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DisputeController extends Controller
{
    public function index(): Response
    {
        $disputes = Job::where('status', JobStatus::Disputed)
            ->with(['member', 'assignedCompany', 'category', 'property.suburb', 'review'])
            ->latest('updated_at')
            ->paginate(30);

        return Inertia::render('Admin/Disputes/Index', ['disputes' => $disputes]);
    }

    public function resolve(ResolveDisputeRequest $request, Job $job, ResolveDisputeAction $action): RedirectResponse
    {
        if ($job->status !== JobStatus::Disputed) {
            return back()->with('error', 'This job is not in a disputed state.');
        }

        $action->execute($job, $request->user(), $request->validated());

        return redirect()->route('admin.disputes')->with('success', 'Dispute resolved.');
    }
}
