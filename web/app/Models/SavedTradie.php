<?php

namespace App\Models;

use Database\Factories\SavedTradieFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedTradie extends Model
{
    /** @use HasFactory<SavedTradieFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = [
        'member_user_id',
        'tradie_company_id',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_user_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }
}
