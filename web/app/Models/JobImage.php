<?php

namespace App\Models;

use Database\Factories\JobImageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobImage extends Model
{
    /** @use HasFactory<JobImageFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'job_id',
        'uploaded_by_user_id',
        'path',
        'mime',
        'size_bytes',
        'caption',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
