<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Http\Controllers\Controller;
use App\Models\Suburb;
use App\Models\TradieServiceArea;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceAreaController extends Controller
{
    /**
     * GET /api/v1/tradie/service-areas
     */
    public function index(Request $request): JsonResponse
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
                'state' => $sa->suburb->state,
            ]);

        return response()->json(['data' => $serviceAreas]);
    }

    /**
     * POST /api/v1/tradie/service-areas
     */
    public function store(Request $request): JsonResponse
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

        return response()->json(['message' => 'Service area added.'], 201);
    }

    /**
     * DELETE /api/v1/tradie/service-areas/{serviceArea}
     */
    public function destroy(Request $request, TradieServiceArea $serviceArea): JsonResponse
    {
        abort_if($serviceArea->tradie_company_id !== $request->user()->tradieCompany?->id, 403);

        $serviceArea->delete();

        return response()->json(['message' => 'Service area removed.']);
    }

    /**
     * GET /api/v1/tradie/suburbs/search?q=...
     * Suburb typeahead for service area search.
     */
    public function searchSuburbs(Request $request): JsonResponse
    {
        $q = $request->query('q', '');

        $suburbs = Suburb::active()
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%"))
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'postcode', 'state']);

        return response()->json(['data' => $suburbs]);
    }
}
