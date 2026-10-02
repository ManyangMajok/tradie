<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Http\Controllers\Controller;
use App\Models\SavedTradie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedTradieController extends Controller
{
    /**
     * GET /api/v1/member/saved-tradies
     */
    public function index(Request $request): JsonResponse
    {
        $savedTradies = SavedTradie::where('member_user_id', $request->user()->id)
            ->with(['tradieCompany' => fn ($q) => $q->select('id', 'business_name', 'rating_average', 'rating_count')])
            ->latest()
            ->get();

        return response()->json(['data' => $savedTradies]);
    }

    /**
     * DELETE /api/v1/member/saved-tradies/{id}
     */
    public function destroy(Request $request, SavedTradie $savedTradie): JsonResponse
    {
        abort_if($savedTradie->member_user_id !== $request->user()->id, 403);

        $savedTradie->delete();

        return response()->json(['message' => 'Tradie unsaved.']);
    }
}
