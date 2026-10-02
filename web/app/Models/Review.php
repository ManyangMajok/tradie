<?php

namespace App\Models;

use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory;

    protected $fillable = [
        'job_id',
        'member_user_id',
        'tradie_company_id',
        'work_completed_status',
        'no_callout_fee_honoured',
        'discount_honoured',
        'stars',
        'review_text',
        'was_auto_confirmed',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'stars' => 'integer',
            'no_callout_fee_honoured' => 'boolean',
            'was_auto_confirmed' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_user_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function isPositive(): bool
    {
        return $this->work_completed_status === 'yes'
            && $this->no_callout_fee_honoured
            && $this->discount_honoured !== 'no';
    }
}
