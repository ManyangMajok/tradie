<?php

namespace App\Models;

use Database\Factories\JobCompletionReportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobCompletionReport extends Model
{
    /** @use HasFactory<JobCompletionReportFactory> */
    use HasFactory;

    protected $fillable = [
        'job_id',
        'tradie_company_id',
        'submitted_by_user_id',
        'summary_of_work',
        'invoice_total_cents',
        'no_callout_fee_confirmed',
        'discount_applied',
        'discount_amount_cents',
        'invoice_document_path',
        'completion_notes',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'invoice_total_cents' => 'integer',
            'no_callout_fee_confirmed' => 'boolean',
            'discount_applied' => 'boolean',
            'discount_amount_cents' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(TradieCompany::class, 'tradie_company_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }
}
