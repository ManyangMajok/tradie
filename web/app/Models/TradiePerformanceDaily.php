<?php

namespace App\Models;

use Database\Factories\TradiePerformanceDailyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradiePerformanceDaily extends Model
{
    /** @use HasFactory<TradiePerformanceDailyFactory> */
    use HasFactory;

    protected $table = 'tradie_performance_daily';

    protected $fillable = [
        'tradie_company_id',
        'date',
        'leads_offered',
        'leads_viewed',
        'leads_accepted',
        'leads_declined',
        'leads_expired',
        'jobs_completed',
        'jobs_disputed',
        'avg_response_time_seconds',
        'reported_revenue_cents',
        'discount_given_cents',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'leads_offered' => 'integer',
            'leads_viewed' => 'integer',
            'leads_accepted' => 'integer',
            'leads_declined' => 'integer',
            'leads_expired' => 'integer',
            'jobs_completed' => 'integer',
            'jobs_disputed' => 'integer',
            'avg_response_time_seconds' => 'integer',
            'reported_revenue_cents' => 'integer',
            'discount_given_cents' => 'integer',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function acceptanceRate(): float
    {
        if ($this->leads_offered === 0) {
            return 0.0;
        }

        return $this->leads_accepted / $this->leads_offered;
    }
}
