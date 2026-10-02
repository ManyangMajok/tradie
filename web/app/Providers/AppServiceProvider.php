<?php

namespace App\Providers;

use App\Models\Job;
use App\Models\JobOffer;
use App\Models\MemberSubscription;
use App\Models\Property;
use App\Models\TradieCompany;
use App\Policies\JobOfferPolicy;
use App\Policies\JobPolicy;
use App\Policies\MemberSubscriptionPolicy;
use App\Policies\PropertyPolicy;
use App\Policies\TradieCompanyPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Job::class, JobPolicy::class);
        Gate::policy(Property::class, PropertyPolicy::class);
        Gate::policy(JobOffer::class, JobOfferPolicy::class);
        Gate::policy(TradieCompany::class, TradieCompanyPolicy::class);
        Gate::policy(MemberSubscription::class, MemberSubscriptionPolicy::class);
    }
}
