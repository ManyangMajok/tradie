<?php

namespace App\Models;

use Database\Factories\TradieCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TradieCategory extends Model
{
    /** @use HasFactory<TradieCategoryFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function issueTypes(): HasMany
    {
        return $this->hasMany(IssueType::class);
    }

    public function companyCategories(): HasMany
    {
        return $this->hasMany(TradieCompanyCategory::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
