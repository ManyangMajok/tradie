<?php

namespace App\Traits;

use App\Models\Job;
use App\Models\JobOffer;
use Illuminate\Support\Facades\Storage;

trait FormatsJobResponse
{
    private function formatJob(Job $job): array
    {
        $suburb = $job->property->suburb;

        $photoUrls = $job->relationLoaded('images')
            ? $job->images->map(fn ($img) => url(Storage::url($img->path)))->values()->toArray()
            : [];

        return [
            'id' => $job->id,
            'public_id' => $job->public_id,
            'status' => $job->status->value,
            'urgency' => $job->urgency->value,
            'title' => $job->category->name.($job->issueType ? ' – '.$job->issueType->name : ''),
            'description' => $job->description,
            'address_line_1' => $job->property->address_line_1,
            'suburb' => $suburb->name,
            'state' => $suburb->state,
            'postcode' => $suburb->postcode,
            'created_at' => $job->created_at->toIso8601String(),
            'scheduled_for' => null,
            'category' => $job->category->name,
            'issue_type' => $job->issueType?->name ?? '',
            'photo_urls' => $photoUrls,
            // Member contact — only populated when member relation is loaded (job detail, not lead cards)
            'member_first_name' => $job->relationLoaded('member') ? ($job->member?->first_name) : null,
            'member_last_name' => $job->relationLoaded('member') ? ($job->member?->last_name) : null,
            'member_phone' => $job->relationLoaded('member') ? ($job->member?->phone) : null,
        ];
    }

    private function formatOffer(JobOffer $offer): array
    {
        return [
            'id' => $offer->id,
            'public_id' => (string) $offer->id,
            'status' => $offer->status->value,
            'offered_at' => $offer->offered_at?->toIso8601String(),
            'expires_at' => $offer->expires_at->toIso8601String(),
            'rank' => $offer->rank_in_round,
            'job' => $this->formatJob($offer->job),
        ];
    }
}
