<?php

use App\Http\Middleware\EnsureActiveMemberSubscription;
use App\Http\Middleware\EnsureApprovedTradie;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
            'member.subscribed' => EnsureActiveMemberSubscription::class,
            'tradie.approved' => EnsureApprovedTradie::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Demo errors are written to storage/logs/laravel.log.
    })->create();
