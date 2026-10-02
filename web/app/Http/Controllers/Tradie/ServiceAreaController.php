<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use App\Models\Suburb;
use App\Models\TradieServiceArea;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceAreaController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $serviceAreas = $company->serviceAreas()
            ->active()
            ->with('suburb')
            ->get()
            ->map(fn (TradieServiceArea $sa) => [
                'id' => $sa->id,
                'suburb_id' => $sa->suburb_id,
                'suburb_name' => $sa->suburb->name,
                'postcode' => $sa->suburb->postcode,
            ]);

        $suburbs = Suburb::active()->orderBy('name')->get(['id', 'name', 'postcode', 'state']);

        return Inertia::render('Tradie/ServiceAreas', [
            'service_areas' => $serviceAreas,
            'suburbs' => $suburbs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'suburb_id' => ['required', 'integer', 'exists:suburbs,id'],
        ]);

        $company = $request->user()->tradieCompany;

        $existing = $company->serviceAreas()
            ->where('suburb_id', $request->suburb_id)
            ->withTrashed()
            ->first();

        if ($existing) {
            $existing->restore();
            $existing->update(['is_active' => true]);
        } else {
            TradieServiceArea::create([
                'tradie_company_id' => $company->id,
                'suburb_id' => $request->suburb_id,
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Service area added.');
    }

    public function destroy(Request $request, TradieServiceArea $serviceArea): RedirectResponse
    {
        if ($serviceArea->tradie_company_id !== $request->user()->tradieCompany?->id) {
            abort(403);
        }

        $serviceArea->delete();

        return back()->with('success', 'Service area removed.');
    }
}
