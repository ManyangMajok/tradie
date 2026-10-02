<?php

namespace App\Models;

use Database\Factories\TradieAvailabilityFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradieAvailability extends Model
{
    /** @use HasFactory<TradieAvailabilityFactory> */
    use HasFactory;

    protected $table = 'tradie_availability';

    protected $fillable = [
        'tradie_company_id',
        'day_of_week',
        'opens_at',
        'closes_at',
        'accepts_emergency',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'accepts_emergency' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function scopeForDay($query, int $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }
}
