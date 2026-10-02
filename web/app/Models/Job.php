<?php

namespace App\Models;

use App\Enums\JobStatus;
use App\Enums\Urgency;
use Database\Factories\JobFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Job extends Model
{
    /** @use HasFactory<JobFactory> */
    use HasFactory;

    protected $fillable = [
        'public_id',
        'member_user_id',
        'property_id',
        'tradie_category_id',
        'issue_type_id',
        'custom_issue',
        'urgency',
        'description',
        'best_contact_time',
        'status',
        'submitted_at',
        'dispatched_at',
        'assigned_tradie_company_id',
        'selected_tradie_company_id',
        'assigned_at',
        'on_the_way_at',
        'started_at',
        'completed_at',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
        'dispatch_round',
        'requires_admin_review',
    ];

    protected function casts(): array
    {
        return [
            'urgency' => Urgency::class,
            'status' => JobStatus::class,
            'submitted_at' => 'datetime',
            'dispatched_at' => 'datetime',
            'assigned_at' => 'datetime',
            'on_the_way_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'dispatch_round' => 'integer',
            'selected_tradie_company_id' => 'integer',
            'requires_admin_review' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // public_id is NOT NULL but encodes the row id. A temporary unique value
        // satisfies the constraint on INSERT; the created hook sets the real value.
        static::creating(function (Job $job): void {
            if (empty($job->public_id)) {
                $job->public_id = 'TMP-'.strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            }
        });

        static::created(function (Job $job): void {
            $job->updateQuietly(['public_id' => self::encodePublicId($job->id)]);
        });
    }

    public static function encodePublicId(int $id): string
    {
        $alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        $encoded = '';
        $value = $id;
        while ($value > 0) {
            $encoded = $alphabet[$value % 32].$encoded;
            $value = intdiv($value, 32);
        }

        return 'JOB-'.str_pad($encoded ?: '0', 5, '0', STR_PAD_LEFT);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_user_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TradieCategory::class, 'tradie_category_id');
    }

    public function issueType(): BelongsTo
    {
        return $this->belongsTo(IssueType::class);
    }

    public function selectedCompany(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'selected_tradie_company_id');
    }

    public function assignedCompany(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'assigned_tradie_company_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(JobOffer::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(JobImage::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(JobStatusLog::class);
    }

    public function completionReport(): HasOne
    {
        return $this->hasOne(JobCompletionReport::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            JobStatus::Assigned->value,
            JobStatus::TradieOnTheWay->value,
            JobStatus::InProgress->value,
        ]);
    }

    public function scopeRequiresAdminReview($query)
    {
        return $query->where('requires_admin_review', true);
    }
}
