<?php

namespace App\Services;

use App\Models\Job;
use App\Models\Property;
use App\Models\Suburb;
use App\Models\TradieCompany;
use Illuminate\Database\Eloquent\Collection;

class AvailableTradies
{
    public function __construct(private EligibleTradieQuery $eligibility) {}

    public function forJob(Job $job): Collection
    {
        $local = $this->candidates($job, false);
        if ($local->isNotEmpty()) {
            return $local->each(fn ($company) => $this->describe($company, $job->property, false))->sortBy([
                fn ($a, $b) => ($a->distance_km ?? INF) <=> ($b->distance_km ?? INF),
                fn ($a, $b) => ($b->rating_average ?? -1) <=> ($a->rating_average ?? -1),
                fn ($a, $b) => strcmp($a->business_name, $b->business_name),
                fn ($a, $b) => $a->id <=> $b->id,
            ])->values();
        }

        $alternatives = $this->candidates($job, true);
        foreach ($alternatives as $company) {
            $this->describe($company, $job->property, true);
        }

        return $alternatives->sortBy([
            fn ($a, $b) => ($a->distance_km ?? INF) <=> ($b->distance_km ?? INF),
            fn ($a, $b) => $b->same_county <=> $a->same_county,
            fn ($a, $b) => ($b->rating_average ?? -1) <=> ($a->rating_average ?? -1),
            fn ($a, $b) => strcmp($a->business_name, $b->business_name),
            fn ($a, $b) => $a->id <=> $b->id,
        ])->values();
    }

    private function candidates(Job $job, bool $otherAreas): Collection
    {
        $ids = $this->eligibility->get($job, $otherAreas)->pluck('id')->unique();

        return TradieCompany::query()->whereIn('id', $ids)
            ->whereHas('owner', fn ($query) => $query->where('status', 'active')->where('role', 'tradie'))
            ->whereHas('serviceAreas', fn ($query) => $query->where('is_active', true)
                ->whereHas('suburb', fn ($suburb) => $suburb->where('is_active', true))
                ->when(! $otherAreas, fn ($area) => $area->where('suburb_id', $job->property->suburb_id)))
            ->with(['serviceAreas' => fn ($query) => $query->where('is_active', true)
                ->whereHas('suburb', fn ($suburb) => $suburb->where('is_active', true))->with('suburb')])
            ->orderByRaw('rating_average IS NULL')->orderByDesc('rating_average')
            ->orderBy('business_name')->orderBy('id')
            ->get(['id', 'business_name', 'about_text', 'rating_average', 'rating_count', 'latitude', 'longitude']);
    }

    private function describe(TradieCompany $company, Property $property, bool $alternative): void
    {
        $origin = $property->suburb;
        $areas = $company->serviceAreas->pluck('suburb');
        $distances = $areas->map(fn ($area) => $this->distance($origin, $area))->filter(fn ($distance) => $distance !== null);
        $company->setAttribute('match_type', $alternative ? 'alternative' : 'local');
        $company->setAttribute('service_area_names', $areas->pluck('name')->unique()->values()->all());
        $company->setAttribute('same_county', $areas->contains(fn ($area) => $area->state === $origin->state));
        $company->setAttribute('area_distance_km', $alternative && $distances->isNotEmpty() ? round($distances->min(), 1) : null);
        $baseDistance = $this->distance($property, $company);
        $company->setAttribute('distance_km', $baseDistance !== null ? round($baseDistance, 1) : $company->area_distance_km);
        $company->setAttribute('distance_basis', $baseDistance !== null ? 'base' : ($company->area_distance_km !== null ? 'area' : null));
        $mapArea = $areas->filter(fn ($area) => $area->latitude !== null && $area->longitude !== null)
            ->sortBy(fn ($area) => $this->distance($origin, $area) ?? INF)->first();
        $hasBase = $company->latitude !== null && $company->longitude !== null;
        $company->setAttribute('map_latitude', $hasBase ? $company->latitude : $mapArea?->latitude);
        $company->setAttribute('map_longitude', $hasBase ? $company->longitude : $mapArea?->longitude);
        $company->setAttribute('map_pin_type', $hasBase ? 'base' : ($mapArea ? 'area' : null));
        $company->offsetUnset('latitude');
        $company->offsetUnset('longitude');
        $company->unsetRelation('serviceAreas');
    }

    private function distance(Suburb|Property $a, Suburb|TradieCompany $b): ?float
    {
        if ($a->latitude === null || $a->longitude === null || $b->latitude === null || $b->longitude === null) {
            return null;
        }
        $latitude = deg2rad($b->latitude - $a->latitude);
        $longitude = deg2rad($b->longitude - $a->longitude);
        $h = sin($latitude / 2) ** 2 + cos(deg2rad($a->latitude)) * cos(deg2rad($b->latitude)) * sin($longitude / 2) ** 2;

        return 6371 * 2 * asin(sqrt(min(1, max(0, $h))));
    }
}
