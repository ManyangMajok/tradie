<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/login
     *
     * Issue a Sanctum personal-access token.
     * Returns the user + token for mobile apps.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
            'app' => ['nullable', 'string', 'in:tradie,member'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Wrong email or password.'],
            ]);
        }

        // Role gating: tradie app rejects non-tradie users, member app rejects non-members
        $app = $request->input('app');
        if ($app === 'tradie' && $user->role !== UserRole::Tradie) {
            return response()->json([
                'message' => 'This account is for members. Use the Tradify Members app (or the local demo website) to access your account.',
            ], 403);
        }
        if ($app === 'member' && $user->role !== UserRole::Member) {
            return response()->json([
                'message' => 'This account is for tradies. Use the Tradify Tradies app to access your account.',
            ], 403);
        }

        // Revoke existing tokens for this device name (prevent duplicates)
        $user->tokens()->where('name', $request->device_name)->delete();

        $token = $user->createToken($request->device_name);

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'access_token' => $token->plainTextToken,
            'refresh_token' => 'placeholder_refresh_'.bin2hex(random_bytes(16)),
            'expires_in' => 3600, // 1 hour (placeholder — Sanctum tokens don't expire by default)
            'user' => [
                'id' => $user->id,
                'role' => $user->role->value,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/refresh
     *
     * Placeholder — always returns a new token.
     * Real implementation would validate the refresh token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Delete the current token, issue a new one
        $currentToken = $request->user()->currentAccessToken();
        $deviceName = $currentToken->name ?? 'unknown';
        $currentToken->delete();

        $token = $user->createToken($deviceName);

        return response()->json([
            'access_token' => $token->plainTextToken,
            'refresh_token' => 'placeholder_refresh_'.bin2hex(random_bytes(16)),
            'expires_in' => 3600,
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     *
     * Revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * GET /api/v1/me
     *
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'id' => $user->id,
            'role' => $user->role->value,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status->value,
        ];

        // Include role-specific data
        if ($user->role === UserRole::Tradie && $user->tradieCompany) {
            $company = $user->tradieCompany;
            $data['company'] = [
                'id' => $company->id,
                'business_name' => $company->business_name,
                'status' => $company->status->value,
                'rating_average' => $company->rating_average,
                'rating_count' => $company->rating_count,
            ];
        }

        return response()->json(['user' => $data]);
    }

    /**
     * POST /api/v1/auth/register-device
     *
     * Placeholder — stores push token in session/log for now.
     * Real implementation needs user_devices migration.
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate([
            'expo_push_token' => ['required', 'string'],
            'platform' => ['required', 'in:ios,android'],
            'app' => ['required', 'in:tradie,member'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'app_version' => ['nullable', 'string', 'max:20'],
        ]);

        // Placeholder: just acknowledge. In production, store in user_devices table.
        logger()->info('Device registered', [
            'user_id' => $request->user()->id,
            'token' => $request->expo_push_token,
        ]);

        return response()->json(['message' => 'Device registered.'], 201);
    }

    /**
     * DELETE /api/v1/auth/unregister-device
     *
     * Placeholder — deregisters push token.
     */
    public function unregisterDevice(Request $request): JsonResponse
    {
        logger()->info('Device unregistered', [
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Device unregistered.']);
    }
}
