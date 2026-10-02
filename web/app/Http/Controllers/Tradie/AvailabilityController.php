<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use App\Models\TradieAvailability;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AvailabilityController extends Controller
{
    private const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    public function show(Request $request): Response
    {
        $company = $request->user()->tradieCompany;

        $availability = collect(range(0, 6))->map(function (int $day) use ($company) {
            $row = $company->availability()->where('day_of_week', $day)->first();

            return [
                'day_of_week' => $day,
                'day_name' => self::DAYS[$day],
                'opens_at' => $row?->opens_at,
                'closes_at' => $row?->closes_at,
                'is_open' => $row && $row->opens_at !== null,
                'accepts_emergency' => $row?->accepts_emergency ?? false,
            ];
        });

        return Inertia::render('Tradie/Availability', ['availability' => $availability]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'availability' => ['required', 'array'],
            'availability.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'availability.*.is_open' => ['required', 'boolean'],
            'availability.*.opens_at' => ['nullable', 'date_format:H:i'],
            'availability.*.closes_at' => ['nullable', 'date_format:H:i', 'after:availability.*.opens_at'],
            'availability.*.accepts_emergency' => ['boolean'],
        ]);

        $company = $request->user()->tradieCompany;

        foreach ($request->availability as $row) {
            TradieAvailability::updateOrCreate(
                ['tradie_company_id' => $company->id, 'day_of_week' => $row['day_of_week']],
                [
                    'opens_at' => $row['is_open'] ? ($row['opens_at'] ?? null) : null,
                    'closes_at' => $row['is_open'] ? ($row['closes_at'] ?? null) : null,
                    'accepts_emergency' => $row['accepts_emergency'] ?? false,
                ]
            );
        }

        return back()->with('success', 'Availability saved.');
    }
}
