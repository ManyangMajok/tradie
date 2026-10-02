<?php

namespace App\Http\Controllers\Api\V1\Tradie;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    /**
     * GET /api/v1/tradie/settings
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->tradieCompany;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            'company' => $company ? [
                'id' => $company->id,
                'business_name' => $company->business_name,
                'trading_name' => $company->trading_name,
                'about_text' => $company->about_text,
                'abn' => $company->abn,
                'licence_number' => $company->licence_number,
                'rating_average' => $company->rating_average,
                'rating_count' => $company->rating_count ?? 0,
            ] : null,
        ]);
    }

    /**
     * PATCH /api/v1/tradie/settings/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $request->user()->update($request->only(['first_name', 'last_name', 'phone']));

        return response()->json(['message' => 'Profile updated.']);
    }

    /**
     * PATCH /api/v1/tradie/settings/password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password changed.']);
    }
}
