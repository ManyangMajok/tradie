<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tradie\SaveAvailabilityRequest;
use App\Models\TradieAvailability;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'opens_at' => $row?->opens_at ? substr($row->opens_at, 0, 5) : null,
                'closes_at' => $row?->closes_at ? substr($row->closes_at, 0, 5) : null,
                'is_open' => $row && $row->opens_at !== null,
                'accepts_emergency' => $row?->accepts_emergency ?? false,
            ];
        });

        return Inertia::render('Tradie/Availability', ['availability' => $availability]);
    }

    public function update(SaveAvailabilityRequest $request): RedirectResponse
    {
        $company = $request->user()->tradieCompany;

        DB::transaction(function () use ($request, $company) {
            foreach ($request->validated('availability') as $row) {
                TradieAvailability::updateOrCreate(
                    ['tradie_company_id' => $company->id, 'day_of_week' => $row['day_of_week']],
                    [
                        'opens_at' => $row['is_open'] ? ($row['opens_at'] ?? null) : null,
                        'closes_at' => $row['is_open'] ? ($row['closes_at'] ?? null) : null,
                        'accepts_emergency' => $row['accepts_emergency'] ?? false,
                    ]
                );
            }

        });

        return back()->with('success', 'Availability saved.');
    }
}
