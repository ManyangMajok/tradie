<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TradieCompanyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SuspendTradieRequest;
use App\Models\TradieCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TradieController extends Controller
{
    public function index(Request $request): Response
    {
        $query = TradieCompany::with(['owner', 'activeSubscription'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->category_id, fn ($q) => $q->whereHas('categories', fn ($c) => $c->where('tradie_category_id', $request->category_id)))
            ->when($request->suburb_id, fn ($q) => $q->whereHas('serviceAreas', fn ($s) => $s->where('suburb_id', $request->suburb_id)));

        $query = match ($request->sort) {
            'rating' => $query->orderByDesc('rating_average'),
            'leads' => $query->withCount('offers')->orderByDesc('offers_count'),
            default => $query->latest(),
        };

        $tradies = $query->paginate(30)->withQueryString();

        return Inertia::render('Admin/Tradies/Index', [
            'tradies' => $tradies,
            'filters' => $request->only(['status', 'category_id', 'suburb_id', 'sort']),
        ]);
    }

    public function show(TradieCompany $tradie): Response
    {
        $tradie->load([
            'owner',
            'categories.category',
            'serviceAreas.suburb',
            'activeSubscription.plan',
            'assignedJobs' => fn ($q) => $q->with('property.suburb', 'category')->latest()->limit(20),
        ]);

        return Inertia::render('Admin/Tradies/Show', ['tradie' => $tradie]);
    }

    public function suspend(SuspendTradieRequest $request, TradieCompany $tradie): RedirectResponse
    {
        $tradie->update([
            'status' => TradieCompanyStatus::Suspended,
            'suspended_reason' => $request->validated('reason'),
        ]);

        return back()->with('success', 'Tradie suspended.');
    }

    public function reinstate(TradieCompany $tradie): RedirectResponse
    {
        if ($tradie->status !== TradieCompanyStatus::Suspended) {
            return back()->with('error', 'Tradie is not currently suspended.');
        }

        $tradie->update([
            'status' => TradieCompanyStatus::Approved,
            'suspended_reason' => null,
        ]);

        return back()->with('success', 'Tradie reinstated.');
    }
}
