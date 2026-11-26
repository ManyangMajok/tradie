<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && ! $request->routeIs('logout')) {
            abort_unless($request->user()->status === UserStatus::Active, 403, 'This account is suspended or inactive.');
        }

        return $next($request);
    }
}
