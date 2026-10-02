<?php

namespace App\Http\Requests\Tradie;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompletionReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'summary_of_work' => ['required', 'string', 'min:10', 'max:2000'],
            'invoice_total_cents' => ['required', 'integer', 'min:0'],
            'no_callout_fee_confirmed' => ['required', 'boolean'],
            'discount_applied' => ['required', 'boolean'],
            'discount_amount_cents' => ['required_if:discount_applied,true', 'nullable', 'integer', 'min:0'],
            'invoice_document_path' => ['nullable', 'string', 'max:500'],
            'completion_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
