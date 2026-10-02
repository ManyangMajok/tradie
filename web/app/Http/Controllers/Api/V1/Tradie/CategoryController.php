<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Http\Controllers\Controller;
use App\Models\TradieCategory;
use App\Models\TradieCompanyCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * GET /api/v1/tradie/categories
     *
     * Returns all categories with is_active flag for this tradie.
     */
    public function index(Request $request): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $activeIds = $company->categories()
            ->where('is_active', true)
            ->pluck('tradie_category_id')
            ->toArray();

        $categories = TradieCategory::where('is_active', true)
            ->get(['id', 'name', 'slug'])
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'is_active' => in_array($c->id, $activeIds),
            ]);

        return response()->json(['data' => $categories]);
    }

    /**
     * POST /api/v1/tradie/categories
     *
     * Idempotent upsert: toggle a category on.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => ['required', 'integer', 'exists:tradie_categories,id'],
            'active' => ['boolean'],
        ]);

        $company = $request->user()->tradieCompany;
        $isActive = (bool) $request->input('active', true);

        TradieCompanyCategory::updateOrCreate(
            ['tradie_company_id' => $company->id, 'tradie_category_id' => $request->category_id],
            ['is_active' => $isActive]
        );

        return response()->json(['message' => $isActive ? 'Category enabled.' : 'Category disabled.'], 201);
    }

    /**
     * DELETE /api/v1/tradie/categories/{category}
     *
     * Soft-disable a category.
     */
    public function destroy(Request $request, TradieCompanyCategory $category): JsonResponse
    {
        abort_if($category->tradie_company_id !== $request->user()->tradieCompany?->id, 403);

        $category->update(['is_active' => false]);

        return response()->json(['message' => 'Category disabled.']);
    }
}
