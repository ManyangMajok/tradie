<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Database\Factories\TradieSubscriptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradieSubscription extends Model
{
    /** @use HasFactory<TradieSubscriptionFactory> */
    use HasFactory;

    protected $fillable = [
        'tradie_company_id',
        'tradie_plan_id',
        'status',
        'start_date',
        'end_date',
        'auto_renew',
        'stripe_subscription_id',
        'stripe_customer_id',
        'canceled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'auto_renew' => 'boolean',
            'canceled_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(TradiePlan::class, 'tradie_plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', SubscriptionStatus::Active);
    }
}
