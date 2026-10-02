<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterTradieStep2Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_ids' => ['required', 'array', 'min:1', 'max:5'],
            'category_ids.*' => ['integer', 'exists:tradie_categories,id'],
            'suburb_ids' => ['required', 'array', 'min:1', 'max:30'],
            'suburb_ids.*' => ['integer', 'exists:suburbs,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_ids.required' => 'Please select at least one trade category.',
            'suburb_ids.required' => 'Please select at least one service area.',
        ];
    }
}
