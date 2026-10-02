<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatus;
use App\Enums\TradieCompanyStatus;
use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprovedTradie
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::Tradie) {
            abort(403);
        }

        $company = $user->tradieCompany;

        if (! $company || $company->status !== TradieCompanyStatus::Approved) {
            return redirect()->route('tradie.pending-approval');
        }

        $hasActive = $company->subscriptions()
            ->whereIn('status', [SubscriptionStatus::Active->value, SubscriptionStatus::PastDue->value])
            ->exists();

        if (! $hasActive) {
            return redirect()->route('tradie.subscription-required');
        }

        return $next($request);
    }
}
