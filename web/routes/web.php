<?php

use App\Http\Controllers\Admin\AccountAccessController;
use App\Http\Controllers\Admin\CrudController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterMemberPlanController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Member\DashboardController as MemberDashboardController;
use App\Http\Controllers\Member\JobController as MemberJobController;
use App\Http\Controllers\Member\MembershipController;
use App\Http\Controllers\Member\PropertyController;
use App\Http\Controllers\Member\SavedTradieController;
use App\Http\Controllers\Tradie\ActivateSubscriptionController;
use App\Http\Controllers\Tradie\AvailabilityController;
use App\Http\Controllers\Tradie\CategoryController;
use App\Http\Controllers\Tradie\JobController as TradieJobController;
use App\Http\Controllers\Tradie\LeadController;
use App\Http\Controllers\Tradie\PerformanceController;
use App\Http\Controllers\Tradie\ServiceAreaController;
use App\Http\Controllers\Tradie\SettingsController;
use App\Http\Controllers\Tradie\SubscriptionController;
use App\Support\CrudResources;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return redirect($request->user() ? match ($request->user()->role->value) {
        'admin' => '/admin', 'tradie' => '/tradie', default => '/dashboard'
    } : '/login');
})->name('home');
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
    Route::get('/password/forgot', [ForgotPasswordController::class, 'show'])->name('password.request');
    Route::post('/password/forgot', [ForgotPasswordController::class, 'store'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/password/reset/{token}', [ResetPasswordController::class, 'show'])->name('password.reset');
    Route::post('/password/reset', [ResetPasswordController::class, 'store'])->name('password.update');
});
Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');
Route::middleware(['auth', 'can:manage-records', 'throttle:120,1'])->prefix('admin')->group(function () {
    Route::get('/', [CrudController::class, 'dashboard'])->name('admin.dashboard');
    Route::prefix('{resource}')->whereIn('resource', array_keys(CrudResources::definitions()))->group(function () {
        Route::get('/', [CrudController::class, 'index']);
        Route::post('/{record}/password-link', [AccountAccessController::class, 'store'])->whereNumber('record')->middleware('throttle:10,1');
        Route::get('/create', [CrudController::class, 'create']);
        Route::post('/', [CrudController::class, 'store']);
        Route::get('/{record}', [CrudController::class, 'show'])->whereNumber('record');
        Route::get('/{record}/edit', [CrudController::class, 'edit'])->whereNumber('record');
        Route::put('/{record}', [CrudController::class, 'update'])->whereNumber('record');
        Route::delete('/{record}', [CrudController::class, 'destroy'])->whereNumber('record');
    });
});

// Member routes
Route::middleware(['auth', 'role:member', 'throttle:60,1'])->prefix('')->group(function () {
    Route::get('/dashboard', MemberDashboardController::class)->name('member.dashboard');

    Route::get('/membership', [MembershipController::class, 'show'])->name('membership');
    Route::get('/membership/success', [MembershipController::class, 'success'])->name('membership.success');
    Route::get('/membership/portal', [MembershipController::class, 'portal'])->name('membership.portal');
    Route::post('/membership/cancel', [MembershipController::class, 'cancel'])->name('membership.cancel');

    Route::get('/membership/required', fn () => Inertia::render('Member/MembershipRequired'))->name('membership.required');

    // Jobs
    Route::get('/jobs', [MemberJobController::class, 'index'])->name('member.jobs');
    Route::get('/jobs/new', [MemberJobController::class, 'create'])->name('member.jobs.create');
    Route::post('/jobs', [MemberJobController::class, 'store'])->name('member.jobs.store');
    Route::get('/jobs/available-tradies', [MemberJobController::class, 'availableTradies'])->name('member.jobs.available-tradies');
    Route::post('/jobs/{publicId}/choose-tradie', [MemberJobController::class, 'chooseTradie'])->name('member.jobs.choose-tradie');
    Route::get('/jobs/{publicId}', [MemberJobController::class, 'show'])->name('member.jobs.show');
    Route::post('/jobs/{publicId}/cancel', [MemberJobController::class, 'cancel'])->name('member.jobs.cancel');
    Route::post('/jobs/{publicId}/review', [MemberJobController::class, 'review'])->name('member.jobs.review');

    Route::post('/saved-tradies', [SavedTradieController::class, 'store'])->name('member.saved-tradies.store');
    Route::get('/saved-tradies', [SavedTradieController::class, 'index'])->name('member.saved-tradies');
    Route::delete('/saved-tradies/{id}', [SavedTradieController::class, 'destroy'])->name('member.saved-tradies.destroy');
});

// Tradie routes
Route::middleware(['auth', 'role:tradie', 'fundi.profile', 'throttle:60,1'])->prefix('tradie')->group(function () {
    Route::get('/', [LeadController::class, 'index'])->name('tradie.leads');

    // Leads
    Route::get('/leads', [LeadController::class, 'index'])->name('tradie.leads.index');
    Route::get('/leads/{offer}', [LeadController::class, 'show'])->name('tradie.leads.show');
    Route::post('/leads/{offer}/accept', [LeadController::class, 'accept'])->name('tradie.leads.accept');
    Route::post('/leads/{offer}/decline', [LeadController::class, 'decline'])->name('tradie.leads.decline');

    // Jobs (post-accept)
    Route::get('/jobs', [TradieJobController::class, 'index'])->name('tradie.jobs.index');
    Route::get('/jobs/{publicId}', [TradieJobController::class, 'show'])->name('tradie.jobs.show');
    Route::post('/jobs/{publicId}/status', [TradieJobController::class, 'updateStatus'])->name('tradie.jobs.status');
    Route::get('/jobs/{publicId}/complete', [TradieJobController::class, 'completeForm'])->name('tradie.jobs.complete.form');
    Route::post('/jobs/{publicId}/complete', [TradieJobController::class, 'complete'])->name('tradie.jobs.complete');

    Route::get('/pending-approval', fn () => Inertia::render('Tradie/PendingApproval'))->name('tradie.pending-approval');
    Route::get('/subscription-required', fn () => Inertia::render('Tradie/SubscriptionRequired'))->name('tradie.subscription-required');

    Route::get('/activate-subscription', [ActivateSubscriptionController::class, 'show'])->name('tradie.activate-subscription');
    Route::post('/activate-subscription', [ActivateSubscriptionController::class, 'store'])->name('tradie.activate-subscription.store');
    Route::get('/activate-subscription/success', [ActivateSubscriptionController::class, 'success'])->name('tradie.subscription.success');

    Route::get('/service-areas', [ServiceAreaController::class, 'index'])->name('tradie.service-areas');
    Route::post('/service-areas', [ServiceAreaController::class, 'store'])->name('tradie.service-areas.store');
    Route::delete('/service-areas/{serviceArea}', [ServiceAreaController::class, 'destroy'])->name('tradie.service-areas.destroy');

    Route::get('/categories', [CategoryController::class, 'index'])->name('tradie.categories');
    Route::post('/categories', [CategoryController::class, 'store'])->name('tradie.categories.store');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('tradie.categories.destroy');

    Route::get('/availability', [AvailabilityController::class, 'show'])->name('tradie.availability');
    Route::patch('/availability', [AvailabilityController::class, 'update'])->name('tradie.availability.update');

    Route::get('/performance', [PerformanceController::class, 'show'])->name('tradie.performance');

    Route::get('/subscription', [SubscriptionController::class, 'show'])->name('tradie.subscription');
    Route::get('/subscription/portal', [SubscriptionController::class, 'portal'])->name('tradie.subscription.portal');

    Route::get('/settings', [SettingsController::class, 'show'])->name('tradie.settings');
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])->name('tradie.settings.profile');
    Route::patch('/settings/company', [SettingsController::class, 'updateCompany'])->name('tradie.settings.company');
    Route::patch('/settings/password', [SettingsController::class, 'updatePassword'])->name('tradie.settings.password');
});

Route::middleware(['auth', 'role:member'])->group(function () {
    Route::get('/register/member/plan', [RegisterMemberPlanController::class, 'show'])->name('register.member.plan');
    Route::post('/register/member/plan', [RegisterMemberPlanController::class, 'store'])->name('register.member.plan.store');
    Route::resource('properties', PropertyController::class)->except(['show']);
    Route::get('/settings', [App\Http\Controllers\Member\SettingsController::class, 'show']);
    Route::patch('/settings/profile', [App\Http\Controllers\Member\SettingsController::class, 'updateProfile']);
    Route::patch('/settings/password', [App\Http\Controllers\Member\SettingsController::class, 'updatePassword']);
});
