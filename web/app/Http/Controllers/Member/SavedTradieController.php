<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\SavedTradie;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SavedTradieController extends Controller
{
    public function index(Request $request): Response
    {
        $saved = SavedTradie::where('member_user_id', $request->user()->id)
            ->with(['company' => fn ($q) => $q->with('categories')])
            ->latest()
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'saved_at' => $s->created_at->toDateString(),
                'company' => [
                    'id' => $s->company->id,
                    'business_name' => $s->company->business_name,
                    'rating_average' => $s->company->rating_average,
                    'rating_count' => $s->company->rating_count,
                    'categories' => $s->company->categories->pluck('name'),
                ],
            ]);

        return Inertia::render('Member/SavedTradies', [
            'savedTradies' => $saved,
        ]);
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        SavedTradie::where('member_user_id', $request->user()->id)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Tradie removed from saved list.');
    }
}
