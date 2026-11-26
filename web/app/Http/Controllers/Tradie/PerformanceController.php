<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceController extends Controller
{
    public function show(Request $request): Response
    {
        $company = $request->user()->tradieCompany;
        $since = now()->subDays(29)->startOfDay();
        // Derive the demo dashboard directly from real records; no aggregation daemon.
        $offers = $company->offers()->where('offered_at', '>=', $since)->whereNotIn('status', ['pending', 'superseded'])->get();
        $reports = $company->completionReports()->where('submitted_at', '>=', $since)->get();
        $accepted = $offers->filter(fn ($offer) => $offer->status->value === 'accepted');
        $response = $accepted->whereNotNull('response_time_seconds')->avg('response_time_seconds');
        $totals = [
            'leads_offered' => $offers->count(),
            'leads_accepted' => $accepted->count(),
            'leads_declined' => $offers->filter(fn ($offer) => $offer->status->value === 'declined')->count(),
            'leads_expired' => $offers->filter(fn ($offer) => $offer->status->value === 'expired')->count(),
            'jobs_completed' => $reports->count(),
            'jobs_disputed' => $company->assignedJobs()->where('status', 'disputed')->where('updated_at', '>=', $since)->count(),
            'reported_revenue_cents' => (int) $reports->sum('invoice_total_cents'),
            'acceptance_rate' => $offers->count() ? round($accepted->count() / $offers->count() * 100, 1) : null,
            'avg_response_minutes' => $response === null ? null : round($response / 60, 1),
        ];
        $daily = collect(range(0, 29))->map(function ($day) use ($since, $offers, $reports) {
            $date = $since->copy()->addDays($day)->toDateString();
            $dayOffers = $offers->filter(fn ($offer) => $offer->offered_at->toDateString() === $date);

            return ['date' => $date, 'leads_offered' => $dayOffers->count(), 'leads_accepted' => $dayOffers->filter(fn ($offer) => $offer->status->value === 'accepted')->count(), 'jobs_completed' => $reports->filter(fn ($report) => $report->submitted_at->toDateString() === $date)->count()];
        });

        return Inertia::render('Tradie/Performance', ['stats' => $totals, 'rating' => ['average' => $company->rating_average, 'count' => $company->rating_count], 'daily' => $daily]);
    }
}
