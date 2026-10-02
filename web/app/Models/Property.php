<?php

namespace App\Models;

use App\Enums\PropertyType;
use Database\Factories\PropertyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    /** @use HasFactory<PropertyFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_user_id',
        'label',
        'address_line_1',
        'address_line_2',
        'suburb_id',
        'property_type',
        'gate_code',
        'access_notes',
        'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'property_type' => PropertyType::class,
            'is_primary' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_user_id');
    }

    public function suburb(): BelongsTo
    {
        return $this->belongsTo(Suburb::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }
}
