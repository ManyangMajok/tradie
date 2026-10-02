<?php

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Database\Factories\MemberSubscriptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberSubscription extends Model
{
    /** @use HasFactory<MemberSubscriptionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'member_plan_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MemberPlan::class, 'member_plan_id');
    }

    public function credits(): HasMany
    {
        return $this->hasMany(MemberCredit::class, 'applied_to_subscription_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', SubscriptionStatus::Active);
    }
}
