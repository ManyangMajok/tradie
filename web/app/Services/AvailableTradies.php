<?php

namespace App\Services;

use App\Models\Job;
use App\Models\TradieCompany;
use Illuminate\Database\Eloquent\Collection;

class AvailableTradies
{
    public function __construct(private EligibleTradieQuery $eligibility) {}

    public function forJob(Job $job): Collection
    {
        $ids = $this->eligibility->get($job)->pluck('id')->unique();

        return TradieCompany::query()->whereIn('id', $ids)
            ->whereHas('serviceAreas', fn ($query) => $query
                ->where('suburb_id', $job->property->suburb_id)->where('is_active', true))
            ->orderByRaw('rating_average IS NULL')->orderByDesc('rating_average')
            ->orderBy('business_name')->orderBy('id')
            ->get(['id', 'business_name', 'about_text', 'rating_average', 'rating_count']);
    }
}
