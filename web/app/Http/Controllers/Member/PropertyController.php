<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\Member\SavePropertyRequest;
use App\Models\Property;
use App\Models\Suburb;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PropertyController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Member/Properties/Index', ['properties' => $request->user()->properties()->with('suburb')->latest()->get()]);
    }

    public function create()
    {
        return Inertia::render('Member/Properties/Form', ['property' => null, 'locations' => Suburb::active()->orderBy('name')->get(['id', 'name'])]);
    }

    public function edit(Property $property)
    {
        Gate::authorize('update', $property);

        return Inertia::render('Member/Properties/Form', ['property' => $property, 'locations' => Suburb::active()->orderBy('name')->get(['id', 'name'])]);
    }

    public function store(SavePropertyRequest $request)
    {
        $request->user()->properties()->create($request->validated() + ['is_primary' => false]);

        return redirect('/properties')->with('success', 'Property added.');
    }

    public function update(SavePropertyRequest $request, Property $property)
    {
        Gate::authorize('update', $property);
        $property->update($request->validated());

        return redirect('/properties')->with('success', 'Property updated.');
    }

    public function destroy(Request $request, Property $property)
    {
        Gate::authorize('delete', $property);
        DB::transaction(function () use ($property) {
            $property = Property::whereKey($property->id)->lockForUpdate()->firstOrFail();
            if ($property->jobs()->exists()) {
                throw ValidationException::withMessages(['property' => 'A property with jobs cannot be deleted.']);
            }
            $property->delete();
        });

        return redirect('/properties')->with('success', 'Property removed.');
    }
}
