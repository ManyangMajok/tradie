<?php

use App\Http\Controllers\Admin\ApplicationController as AdminApplicationController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DisputeController as AdminDisputeController;
use App\Http\Controllers\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\Admin\IssueTypeController as AdminIssueTypeController;
use App\Http\Controllers\Admin\JobController as AdminJobController;
use App\Http\Controllers\Admin\MetricsController as AdminMetricsController;
use App\Http\Controllers\Admin\SuburbController as AdminSuburbController;
use App\Http\Controllers\Admin\TradieController as AdminTradieController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterMemberAccountController;
use App\Http\Controllers\Auth\RegisterMemberPlanController;
use App\Http\Controllers\Auth\RegisterMemberPropertyController;
use App\Http\Controllers\Auth\RegisterTradieController;
use App\Http\Controllers\Auth\RegisterTradieDocumentController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Member\DashboardController as MemberDashboardController;
use App\Http\Controllers\Member\JobController as MemberJobController;
use App\Http\Controllers\Member\MembershipController;
use App\Http\Controllers\Member\SavedTradieController;
use App\Http\Controllers\Tradie\ActivateSubscriptionController;
use App\Http\Controllers\Tradie\AvailabilityController;
use App\Http\Controllers\Tradie\CategoryController;
use App\Http\Controllers\Tradie\DashboardController as TradieDashboardController;
use App\Http\Controllers\Tradie\JobController as TradieJobController;
use App\Http\Controllers\Tradie\LeadController;
use App\Http\Controllers\Tradie\PerformanceController;
use App\Http\Controllers\Tradie\ServiceAreaController;
use App\Http\Controllers\Tradie\SettingsController;
use App\Http\Controllers\Tradie\SubscriptionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public
Route::get('/', fn () => Inertia::render('Public/Home'))->name('home');

// Auth — guests only
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');

    Route::get('/password/forgot', [ForgotPasswordController::class, 'show'])->name('password.request');
    Route::post('/password/forgot', [ForgotPasswordController::class, 'store'])->name('password.email');

    Route::get('/password/reset/{token}', [ResetPasswordController::class, 'show'])->name('password.reset');
    Route::post('/password/reset', [ResetPasswordController::class, 'store'])->name('password.update');

    // Member registration wizard (step 1 is guest-only)
    Route::get('/register/member', [RegisterMemberAccountController::class, 'show'])->name('register.member');
    Route::post('/register/member', [RegisterMemberAccountController::class, 'store'])->name('register.member.store');

    // Tradie registration wizard (all steps guest, session-based draft)
    Route::get('/register/tradie/step-1', [RegisterTradieController::class, 'showStep1'])->name('register.tradie.step1');
    Route::post('/register/tradie/step-1', [RegisterTradieController::class, 'storeStep1'])->name('register.tradie.step1.store');
    Route::get('/register/tradie/step-2', [RegisterTradieController::class, 'showStep2'])->name('register.tradie.step2');
    Route::post('/register/tradie/step-2', [RegisterTradieController::class, 'storeStep2'])->name('register.tradie.step2.store');
    Route::get('/register/tradie/step-3', [RegisterTradieController::class, 'showStep3'])->name('register.tradie.step3');
    Route::post('/register/tradie/step-3', [RegisterTradieController::class, 'storeStep3'])->name('register.tradie.step3.store');
    Route::get('/register/tradie/step-4', [RegisterTradieController::class, 'showStep4'])->name('register.tradie.step4');
    Route::post('/register/tradie/step-4', [RegisterTradieController::class, 'storeStep4'])->name('register.tradie.step4.store');

    // Document upload (no auth — guest can upload before final submit)
    Route::post('/register/tradie/upload-doc', [RegisterTradieDocumentController::class, 'store'])->name('register.tradie.upload-doc');
});

// Member registration wizard — authenticated steps
Route::middleware('auth')->group(function () {
    Route::get('/register/member/property', [RegisterMemberPropertyController::class, 'show'])->name('register.member.property');
    Route::post('/register/member/property', [RegisterMemberPropertyController::class, 'store'])->name('register.member.property.store');

    Route::get('/register/member/plan', [RegisterMemberPlanController::class, 'show'])->name('register.member.plan');
    Route::post('/register/member/plan', [RegisterMemberPlanController::class, 'store'])->name('register.member.plan.store');
});

// Auth logout
Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

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

    Route::get('/saved-tradies', [SavedTradieController::class, 'index'])->name('member.saved-tradies');
    Route::delete('/saved-tradies/{id}', [SavedTradieController::class, 'destroy'])->name('member.saved-tradies.destroy');
});

// Tradie routes
Route::middleware(['auth', 'role:tradie', 'throttle:60,1'])->prefix('tradie')->group(function () {
    Route::get('/', TradieDashboardController::class)->name('tradie.leads');

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

// Admin routes
Route::middleware(['auth', 'role:admin', 'throttle:120,1'])->prefix('admin')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('admin.dashboard');

    Route::get('/applications', [AdminApplicationController::class, 'index'])->name('admin.applications');
    Route::post('/applications/{application}/approve', [AdminApplicationController::class, 'approve'])->name('admin.applications.approve');
    Route::post('/applications/{application}/reject', [AdminApplicationController::class, 'reject'])->name('admin.applications.reject');

    Route::get('/documents/{path}', [AdminDocumentController::class, 'show'])
        ->where('path', '.+')
        ->name('admin.documents.show');

    // Jobs
    Route::get('/jobs', [AdminJobController::class, 'index'])->name('admin.jobs');
    Route::get('/jobs/{publicId}', [AdminJobController::class, 'show'])->name('admin.jobs.show');
    Route::post('/jobs/{publicId}/assign', [AdminJobController::class, 'assign'])->name('admin.jobs.assign');
    Route::post('/jobs/{publicId}/redispatch', [AdminJobController::class, 'redispatch'])->name('admin.jobs.redispatch');
    Route::post('/jobs/{publicId}/cancel', [AdminJobController::class, 'cancel'])->name('admin.jobs.cancel');

    // Tradies
    Route::get('/tradies', [AdminTradieController::class, 'index'])->name('admin.tradies');
    Route::get('/tradies/{tradie}', [AdminTradieController::class, 'show'])->name('admin.tradies.show');
    Route::post('/tradies/{tradie}/suspend', [AdminTradieController::class, 'suspend'])->name('admin.tradies.suspend');
    Route::post('/tradies/{tradie}/reinstate', [AdminTradieController::class, 'reinstate'])->name('admin.tradies.reinstate');

    // Disputes
    Route::get('/disputes', [AdminDisputeController::class, 'index'])->name('admin.disputes');
    Route::post('/disputes/{job}/resolve', [AdminDisputeController::class, 'resolve'])->name('admin.disputes.resolve');

    // Metrics
    Route::get('/metrics', AdminMetricsController::class)->name('admin.metrics');

    // Reference data (read-only at MVP)
    Route::get('/suburbs', [AdminSuburbController::class, 'index'])->name('admin.suburbs');
    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('admin.categories');
    Route::get('/issue-types', [AdminIssueTypeController::class, 'index'])->name('admin.issue-types');
});
