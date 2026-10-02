<?php

namespace App\Models;

use App\Enums\OfferStatus;
use Database\Factories\JobOfferFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOffer extends Model
{
    /** @use HasFactory<JobOfferFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'job_id',
        'tradie_company_id',
        'round',
        'rank_in_round',
        'score',
        'status',
        'offered_at',
        'viewed_at',
        'accepted_at',
        'declined_at',
        'declined_reason',
        'expired_at',
        'expires_at',
        'superseded_at',
    ];

    // response_time_seconds is a GENERATED STORED column — never write to it
    protected $guarded = ['response_time_seconds'];

    protected function casts(): array
    {
        return [
            'status' => OfferStatus::class,
            'score' => 'float',
            'round' => 'integer',
            'rank_in_round' => 'integer',
            'response_time_seconds' => 'integer',
            'offered_at' => 'datetime',
            'viewed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'declined_at' => 'datetime',
            'expired_at' => 'datetime',
            'expires_at' => 'datetime',
            'superseded_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function scopeOffered($query)
    {
        return $query->where('status', OfferStatus::Offered);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [OfferStatus::Offered->value, OfferStatus::Viewed->value]);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', OfferStatus::Offered)
            ->where('expires_at', '<=', now());
    }
}
