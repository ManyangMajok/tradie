<?php

namespace App\Http\Requests\Member;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'work_completed_status' => ['required', 'string', 'in:yes,partial,no'],
            'no_callout_fee_honoured' => ['required', 'boolean'],
            'discount_honoured' => ['required', 'string', 'in:yes,no,na'],
            'stars' => ['required', 'integer', 'between:1,5'],
            'review_text' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
