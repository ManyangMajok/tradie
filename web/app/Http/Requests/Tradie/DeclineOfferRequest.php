<?php

namespace App\Http\Requests\Tradie;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeclineOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', Rule::in(['too_far', 'busy', 'not_my_work', 'other'])],
        ];
    }
}
