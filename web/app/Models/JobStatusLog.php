<?php

namespace App\Models;

use App\Enums\JobStatus;
use Database\Factories\JobStatusLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobStatusLog extends Model
{
    /** @use HasFactory<JobStatusLogFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'job_id',
        'from_status',
        'to_status',
        'changed_by_user_id',
        'changed_by_system',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => JobStatus::class,
            'to_status' => JobStatus::class,
            'changed_by_system' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
