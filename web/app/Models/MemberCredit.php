<?php

namespace App\Models;

use Database\Factories\MemberCreditFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberCredit extends Model
{
    /** @use HasFactory<MemberCreditFactory> */
    use HasFactory;

    protected $fillable = [
        'member_user_id',
        'amount_cents',
        'reason',
        'created_by_user_id',
        'applied_to_subscription_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function appliedToSubscription(): BelongsTo
    {
        return $this->belongsTo(MemberSubscription::class, 'applied_to_subscription_id');
    }
}
