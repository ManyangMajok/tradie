<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveMemberSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::Member) {
            abort(403);
        }

        $hasActive = $user->memberSubscriptions()
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->exists();

        if (! $hasActive) {
            return redirect()->route('membership.required');
        }

        return $next($request);
    }
}
