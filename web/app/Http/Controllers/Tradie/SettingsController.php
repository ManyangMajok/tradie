<?php

namespace App\Http\Controllers\Tradie;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $company = $user->tradieCompany;

        return Inertia::render('Tradie/Settings', [
            'profile' => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'company' => [
                'latitude' => $company->latitude, 'longitude' => $company->longitude,
                'business_name' => $company->is_independent ? '' : $company->business_name,
                'trading_name' => $company->trading_name,
                'about_text' => $company->about_text,
            ],
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $request->user()->update($request->validated());
            if ($request->user()->tradieCompany->is_independent) {
                $request->user()->tradieCompany->update(['business_name' => trim($request->user()->first_name.' '.$request->user()->last_name)]);
            }
        });

        return back()->with('success', 'Profile updated.');
    }

    public function updateCompany(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
            'business_name' => ['nullable', 'string', 'max:200'],
            'trading_name' => ['nullable', 'string', 'max:120'],
            'about_text' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['is_independent'] = empty($data['business_name']);
        $data['business_name'] = $data['business_name'] ?: trim($request->user()->first_name.' '.$request->user()->last_name);
        $request->user()->tradieCompany->update($data);

        return back()->with('success', 'Business details updated.');
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $request->user()->update(['password' => $request->validated('password')]);

        return back()->with('success', 'Password changed.');
    }
}
