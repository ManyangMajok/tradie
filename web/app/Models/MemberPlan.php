<?php

namespace App\Models;

use Database\Factories\MemberPlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberPlan extends Model
{
    /** @use HasFactory<MemberPlanFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'yearly_price_cents',
        'max_properties',
        'includes_discount',
        'discount_percent',
        'priority_dispatch',
        'stripe_price_id',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'yearly_price_cents' => 'integer',
            'max_properties' => 'integer',
            'includes_discount' => 'boolean',
            'discount_percent' => 'integer',
            'priority_dispatch' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(MemberSubscription::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
