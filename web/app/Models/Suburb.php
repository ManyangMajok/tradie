<?php

namespace App\Models;

use Database\Factories\SuburbFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Suburb extends Model
{
    /** @use HasFactory<SuburbFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'postcode',
        'state',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function serviceAreas(): HasMany
    {
        return $this->hasMany(TradieServiceArea::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
