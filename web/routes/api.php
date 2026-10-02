<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Member\DashboardController as MemberDashboardController;
use App\Http\Controllers\Api\V1\Member\JobController as MemberJobController;
use App\Http\Controllers\Api\V1\Member\MembershipController;
use App\Http\Controllers\Api\V1\Member\PropertyController;
use App\Http\Controllers\Api\V1\Member\SavedTradieController;
use App\Http\Controllers\Api\V1\Tradie\AvailabilityController;
use App\Http\Controllers\Api\V1\Tradie\CategoryController;
use App\Http\Controllers\Api\V1\Tradie\JobController as TradieJobController;
use App\Http\Controllers\Api\V1\Tradie\LeadController;
use App\Http\Controllers\Api\V1\Tradie\PerformanceController;
use App\Http\Controllers\Api\V1\Tradie\ServiceAreaController;
use App\Http\Controllers\Api\V1\Tradie\SettingsController;
use App\Http\Controllers\Api\V1\Tradie\SubscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile API Routes  — /api/v1/*
|--------------------------------------------------------------------------
|
| All routes serve the React Native mobile apps.
| Auth via Sanctum personal-access tokens (Bearer header).
|
| NOTE: Subscription endpoints are PLACEHOLDERS for local testing.
|       The dev seeder creates active subscriptions without Stripe.
|       Swap to real Stripe / Cashier logic before production launch.
|
*/

// ─── Public ──────────────────────────────────────────────────────────────────
Route::prefix('v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// ─── Authenticated ───────────────────────────────────────────────────────────
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // ── Auth management ──────────────────────────────────────────────────
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Device registration (push notifications) ─────────────────────────
    Route::post('/auth/register-device', [AuthController::class, 'registerDevice']);
    Route::delete('/auth/unregister-device', [AuthController::class, 'unregisterDevice']);

    // ── Tradie routes ────────────────────────────────────────────────────
    Route::prefix('tradie')->middleware('role:tradie')->group(function () {

        // Leads (job offers)
        Route::get('/leads', [LeadController::class, 'index']);
        Route::get('/leads/{offer}', [LeadController::class, 'show']);
        Route::post('/leads/{offer}/accept', [LeadController::class, 'accept']);
        Route::post('/leads/{offer}/decline', [LeadController::class, 'decline']);

        // Jobs (post-accept)
        Route::get('/jobs', [TradieJobController::class, 'index']);
        Route::get('/jobs/{publicId}', [TradieJobController::class, 'show']);
        Route::post('/jobs/{publicId}/status', [TradieJobController::class, 'updateStatus']);
        Route::post('/jobs/{publicId}/complete', [TradieJobController::class, 'complete']);

        // Performance
        Route::get('/performance', [PerformanceController::class, 'show']);

        // Service areas
        Route::get('/service-areas', [ServiceAreaController::class, 'index']);
        Route::post('/service-areas', [ServiceAreaController::class, 'store']);
        Route::delete('/service-areas/{serviceArea}', [ServiceAreaController::class, 'destroy']);
        Route::get('/suburbs/search', [ServiceAreaController::class, 'searchSuburbs']);

        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Availability
        Route::get('/availability', [AvailabilityController::class, 'show']);
        Route::patch('/availability', [AvailabilityController::class, 'update']);

        // Subscription (placeholder — no Stripe)
        Route::get('/subscription', [SubscriptionController::class, 'show']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'show']);
        Route::patch('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::patch('/settings/password', [SettingsController::class, 'updatePassword']);
    });

    // ── Member routes ────────────────────────────────────────────────────
    Route::prefix('member')->middleware('role:member')->group(function () {

        // Dashboard
        Route::get('/dashboard', MemberDashboardController::class);

        // Jobs
        Route::get('/jobs', [MemberJobController::class, 'index']);
        Route::get('/jobs/create', [MemberJobController::class, 'create']);
        Route::post('/jobs', [MemberJobController::class, 'store']);
        Route::get('/jobs/{publicId}', [MemberJobController::class, 'show']);
        Route::post('/jobs/{publicId}/cancel', [MemberJobController::class, 'cancel']);
        Route::post('/jobs/{publicId}/review', [MemberJobController::class, 'review']);

        // Properties
        Route::get('/properties', [PropertyController::class, 'index']);
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::get('/properties/{property}', [PropertyController::class, 'show']);
        Route::patch('/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);

        // Membership (placeholder — no Stripe)
        Route::get('/membership', [MembershipController::class, 'show']);

        // Saved tradies
        Route::get('/saved-tradies', [SavedTradieController::class, 'index']);
        Route::delete('/saved-tradies/{savedTradie}', [SavedTradieController::class, 'destroy']);
    });
});
