<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Tradie/Leads/Index', [
            'leads' => [],
        ]);
    }
}
