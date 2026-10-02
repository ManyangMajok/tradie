<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Http\Controllers\Controller;
use App\Models\TradieAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    /**
     * GET /api/v1/tradie/availability
     */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()->tradieCompany;

        $slots = collect(range(0, 6))->map(function (int $day) use ($company) {
            $row = $company->availability()->where('day_of_week', $day)->first();

            return [
                'day' => $day,
                'is_available' => $row && $row->opens_at !== null,
                'start_time' => $row?->opens_at ? substr($row->opens_at, 0, 5) : '08:00',
                'end_time' => $row?->closes_at ? substr($row->closes_at, 0, 5) : '17:00',
            ];
        });

        $acceptEmergency = $company->availability()
            ->where('accepts_emergency', true)
            ->exists();

        return response()->json([
            'slots' => $slots,
            'accept_emergency' => $acceptEmergency,
        ]);
    }

    /**
     * PATCH /api/v1/tradie/availability
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'slots' => ['required', 'array'],
            'slots.*.day' => ['required', 'integer', 'min:0', 'max:6'],
            'slots.*.is_available' => ['required', 'boolean'],
            'slots.*.start_time' => ['nullable', 'date_format:H:i'],
            'slots.*.end_time' => ['nullable', 'date_format:H:i'],
            'accept_emergency' => ['boolean'],
        ]);

        $company = $request->user()->tradieCompany;
        $acceptEmergency = (bool) $request->input('accept_emergency', false);

        foreach ($request->slots as $slot) {
            TradieAvailability::updateOrCreate(
                ['tradie_company_id' => $company->id, 'day_of_week' => $slot['day']],
                [
                    'opens_at' => $slot['is_available'] ? ($slot['start_time'] ?? null) : null,
                    'closes_at' => $slot['is_available'] ? ($slot['end_time'] ?? null) : null,
                    'accepts_emergency' => $acceptEmergency,
                ]
            );
        }

        return response()->json(['message' => 'Availability saved.']);
    }
}
