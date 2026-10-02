<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Suburb;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuburbController extends Controller
{
    public function index(Request $request): Response
    {
        $suburbs = Suburb::query()
            ->when($request->input('q'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('postcode', 'like', "%{$search}%")
            )
            ->when($request->input('active') !== null, fn ($q) => $q->where('is_active', $request->boolean('active'))
            )
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/Suburbs/Index', [
            'suburbs' => $suburbs,
            'filters' => $request->only('q', 'active'),
        ]);
    }
}
