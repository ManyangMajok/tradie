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

        $rows = $company->performanceDaily()
            ->where('date', '>=', now()->subDays(29)->toDateString())
            ->orderBy('date')
            ->get();

        $totals = [
            'leads_offered' => $rows->sum('leads_offered'),
            'leads_accepted' => $rows->sum('leads_accepted'),
            'leads_declined' => $rows->sum('leads_declined'),
            'leads_expired' => $rows->sum('leads_expired'),
            'jobs_completed' => $rows->sum('jobs_completed'),
            'jobs_disputed' => $rows->sum('jobs_disputed'),
            'reported_revenue_cents' => $rows->sum('reported_revenue_cents'),
        ];

        $offered = $totals['leads_offered'];
        $totals['acceptance_rate'] = $offered > 0
            ? round($totals['leads_accepted'] / $offered * 100, 1)
            : null;

        $avgResponse = $rows->whereNotNull('avg_response_time_seconds')->avg('avg_response_time_seconds');
        $totals['avg_response_minutes'] = $avgResponse !== null ? round($avgResponse / 60, 1) : null;

        return Inertia::render('Tradie/Performance', [
            'stats' => $totals,
            'rating' => [
                'average' => $company->rating_average,
                'count' => $company->rating_count,
            ],
            'daily' => $rows->map(fn ($r) => [
                'date' => $r->date->toDateString(),
                'leads_offered' => $r->leads_offered,
                'leads_accepted' => $r->leads_accepted,
                'jobs_completed' => $r->jobs_completed,
            ]),
        ]);
    }
}
