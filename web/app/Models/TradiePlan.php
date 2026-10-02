<?php

namespace App\Models;

use Database\Factories\TradiePlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TradiePlan extends Model
{
    /** @use HasFactory<TradiePlanFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'yearly_price_cents',
        'dispatch_rank_boost',
        'featured_listing',
        'suburb_exclusivity',
        'stripe_price_id',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'yearly_price_cents' => 'integer',
            'dispatch_rank_boost' => 'integer',
            'featured_listing' => 'boolean',
            'suburb_exclusivity' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TradieSubscription::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
