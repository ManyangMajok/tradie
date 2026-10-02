<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use App\Models\TradieCategory;
use App\Models\TradieCompanyCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $myCategories = $company->categories()
            ->active()
            ->with('category')
            ->get()
            ->map(fn (TradieCompanyCategory $c) => [
                'id' => $c->id,
                'category_id' => $c->tradie_category_id,
                'name' => $c->category->name,
                'slug' => $c->category->slug,
            ]);

        $allCategories = TradieCategory::active()->get(['id', 'slug', 'name']);

        return Inertia::render('Tradie/Categories', [
            'my_categories' => $myCategories,
            'all_categories' => $allCategories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'category_id' => ['required', 'integer', 'exists:tradie_categories,id'],
        ]);

        $company = $request->user()->tradieCompany;

        $existing = $company->categories()
            ->where('tradie_category_id', $request->category_id)
            ->withTrashed()
            ->first();

        if ($existing) {
            $existing->restore();
            $existing->update(['is_active' => true]);
        } else {
            TradieCompanyCategory::create([
                'tradie_company_id' => $company->id,
                'tradie_category_id' => $request->category_id,
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Category added.');
    }

    public function destroy(Request $request, TradieCompanyCategory $category): RedirectResponse
    {
        if ($category->tradie_company_id !== $request->user()->tradieCompany?->id) {
            abort(403);
        }

        $category->delete();

        return back()->with('success', 'Category removed.');
    }
}
