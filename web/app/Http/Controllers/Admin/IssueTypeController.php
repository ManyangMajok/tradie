<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IssueType;
use App\Models\TradieCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssueTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $categoryId = $request->input('category_id');

        $issueTypes = IssueType::with('category')
            ->when($categoryId, fn ($q) => $q->where('tradie_category_id', $categoryId))
            ->orderBy('tradie_category_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'slug' => $t->slug,
                'name' => $t->name,
                'category' => $t->category->name,
                'sort_order' => $t->sort_order,
                'is_active' => $t->is_active,
            ]);

        $categories = TradieCategory::orderBy('sort_order')->get(['id', 'name']);

        return Inertia::render('Admin/IssueTypes/Index', [
            'issueTypes' => $issueTypes,
            'categories' => $categories,
            'filters' => $request->only('category_id'),
        ]);
    }
}
