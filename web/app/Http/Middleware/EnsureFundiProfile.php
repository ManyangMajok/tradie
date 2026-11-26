<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureFundiProfile
{
    public function handle(Request $request, Closure $next)
    {
        $profile = app(\App\Actions\EnsureFundiProfile::class)->execute($request->user());
        $request->user()->setRelation('tradieCompany', $profile);

        return $next($request);
    }
}
