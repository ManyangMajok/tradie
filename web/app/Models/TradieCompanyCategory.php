<?php

namespace App\Models;

use Database\Factories\TradieCompanyCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TradieCompanyCategory extends Model
{
    /** @use HasFactory<TradieCompanyCategoryFactory> */
    use HasFactory, SoftDeletes;

    public const UPDATED_AT = null;

    protected $fillable = [
        'tradie_company_id',
        'tradie_category_id',
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

    public function category(): BelongsTo
    {
        return $this->belongsTo(TradieCategory::class, 'tradie_category_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
