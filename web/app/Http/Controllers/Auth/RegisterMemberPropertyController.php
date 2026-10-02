<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterMemberPropertyRequest;
use App\Models\Property;
use App\Models\Suburb;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegisterMemberPropertyController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('Auth/Register/MemberProperty', [
            'suburbs' => Suburb::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'postcode', 'state']),
        ]);
    }

    public function store(RegisterMemberPropertyRequest $request): RedirectResponse
    {
        Property::create([
            'member_user_id' => $request->user()->id,
            'label' => $request->label,
            'address_line_1' => $request->address_line_1,
            'address_line_2' => $request->address_line_2,
            'suburb_id' => $request->suburb_id,
            'property_type' => $request->property_type,
            'gate_code' => $request->gate_code,
            'access_notes' => $request->access_notes,
            'is_primary' => true,
        ]);

        return redirect()->route('register.member.plan');
    }
}
