<?php

namespace App\Http\Controllers\Api\V1\Member;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    /**
     * GET /api/v1/member/properties
     */
    public function index(Request $request): JsonResponse
    {
        $properties = $request->user()->properties()
            ->with('suburb')
            ->whereNull('deleted_at')
            ->get();

        return response()->json(['data' => $properties]);
    }

    /**
     * GET /api/v1/member/properties/{id}
     */
    public function show(Request $request, Property $property): JsonResponse
    {
        abort_if($property->member_user_id !== $request->user()->id, 403);

        $property->load('suburb');

        return response()->json(['data' => $property]);
    }

    /**
     * POST /api/v1/member/properties
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'suburb_id' => ['required', 'integer', 'exists:suburbs,id'],
            'property_type' => ['required', 'string'],
            'gate_code' => ['nullable', 'string', 'max:50'],
            'access_notes' => ['nullable', 'string', 'max:1000'],
            'is_primary' => ['boolean'],
        ]);

        $user = $request->user();

        // Plan limit check (simplified — real check uses plan's property_limit)
        $subscription = $user->memberSubscriptions()
            ->with('plan')
            ->where('status', 'active')
            ->latest()
            ->first();

        if ($subscription && $subscription->plan) {
            $limit = $subscription->plan->max_properties ?? 999;
            $current = $user->properties()->whereNull('deleted_at')->count();
            if ($current >= $limit) {
                return response()->json([
                    'message' => 'Property limit reached for your plan. Upgrade to add more.',
                ], 422);
            }
        }

        // If setting as primary, unset others
        if ($data['is_primary'] ?? false) {
            $user->properties()->update(['is_primary' => false]);
        }

        $property = Property::create([
            'member_user_id' => $user->id,
            ...$data,
        ]);

        return response()->json(['data' => $property->load('suburb')], 201);
    }

    /**
     * PATCH /api/v1/member/properties/{id}
     */
    public function update(Request $request, Property $property): JsonResponse
    {
        abort_if($property->member_user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'address_line_1' => ['sometimes', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'suburb_id' => ['sometimes', 'integer', 'exists:suburbs,id'],
            'property_type' => ['sometimes', 'string'],
            'gate_code' => ['nullable', 'string', 'max:50'],
            'access_notes' => ['nullable', 'string', 'max:1000'],
            'is_primary' => ['boolean'],
        ]);

        if ($data['is_primary'] ?? false) {
            $request->user()->properties()->where('id', '!=', $property->id)->update(['is_primary' => false]);
        }

        $property->update($data);

        return response()->json(['data' => $property->fresh()->load('suburb')]);
    }

    /**
     * DELETE /api/v1/member/properties/{id}
     */
    public function destroy(Request $request, Property $property): JsonResponse
    {
        abort_if($property->member_user_id !== $request->user()->id, 403);

        // Check for non-terminal jobs
        $hasActiveJobs = $property->jobs()
            ->whereNotIn('status', ['confirmed', 'cancelled'])
            ->exists();

        if ($hasActiveJobs) {
            return response()->json([
                'message' => 'Cannot delete — this property has active jobs.',
            ], 422);
        }

        $property->delete(); // soft delete

        return response()->json(['message' => 'Property removed.']);
    }
}
