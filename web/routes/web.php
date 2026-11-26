<?php

use App\Http\Controllers\Admin\CrudController;
use App\Http\Controllers\Auth\LoginController;
use App\Support\CrudResources;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/admin')->name('home');
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});
Route::post('/logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');
Route::middleware(['auth', 'can:manage-records', 'throttle:120,1'])->prefix('admin')->group(function () {
    Route::get('/', [CrudController::class, 'dashboard'])->name('admin.dashboard');
    Route::prefix('{resource}')->whereIn('resource', array_keys(CrudResources::definitions()))->group(function () {
        Route::get('/', [CrudController::class, 'index']);
        Route::get('/create', [CrudController::class, 'create']);
        Route::post('/', [CrudController::class, 'store']);
        Route::get('/{record}', [CrudController::class, 'show'])->whereNumber('record');
        Route::get('/{record}/edit', [CrudController::class, 'edit'])->whereNumber('record');
        Route::put('/{record}', [CrudController::class, 'update'])->whereNumber('record');
        Route::delete('/{record}', [CrudController::class, 'destroy'])->whereNumber('record');
    });
});
