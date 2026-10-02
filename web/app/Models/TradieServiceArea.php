<?php

namespace App\Models;

use Database\Factories\TradieServiceAreaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TradieServiceArea extends Model
{
    /** @use HasFactory<TradieServiceAreaFactory> */
    use HasFactory, SoftDeletes;

    public const UPDATED_AT = null;

    protected $fillable = [
        'tradie_company_id',
        'suburb_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function suburb(): BelongsTo
    {
        return $this->belongsTo(Suburb::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
