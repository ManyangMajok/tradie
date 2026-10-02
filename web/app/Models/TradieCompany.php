<?php

namespace App\Models;

use App\Enums\TradieCompanyStatus;
use Database\Factories\TradieCompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class TradieCompany extends Model
{
    /** @use HasFactory<TradieCompanyFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_user_id',
        'business_name',
        'trading_name',
        'abn',
        'licence_number',
        'licence_state',
        'licence_expires_on',
        'insurance_expires_on',
        'licence_document_path',
        'insurance_document_path',
        'about_text',
        'logo_path',
        'rating_average',
        'rating_count',
        'status',
        'approved_at',
        'approved_by_user_id',
        'suspended_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => TradieCompanyStatus::class,
            'rating_average' => 'float',
            'rating_count' => 'integer',
            'licence_expires_on' => 'date',
            'insurance_expires_on' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TradieSubscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(TradieSubscription::class)
            ->whereIn('status', ['active', 'past_due'])
            ->latest();
    }

    public function categories(): HasMany
    {
        return $this->hasMany(TradieCompanyCategory::class);
    }

    public function serviceAreas(): HasMany
    {
        return $this->hasMany(TradieServiceArea::class);
    }

    public function availability(): HasMany
    {
        return $this->hasMany(TradieAvailability::class);
    }

    public function performanceDaily(): HasMany
    {
        return $this->hasMany(TradiePerformanceDaily::class);
    }

    public function assignedJobs(): HasMany
    {
        return $this->hasMany(Job::class, 'assigned_tradie_company_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(JobOffer::class);
    }

    public function completionReports(): HasMany
    {
        return $this->hasMany(JobCompletionReport::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function savedByMembers(): HasMany
    {
        return $this->hasMany(SavedTradie::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', TradieCompanyStatus::Approved);
    }
}
