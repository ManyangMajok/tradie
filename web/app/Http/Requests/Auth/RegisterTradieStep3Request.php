<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterTradieStep3Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'licence_number' => ['required', 'string', 'max:100'],
            'licence_state' => ['required', 'string', 'in:KE'],
            'licence_expires_on' => ['required', 'date', 'after:today'],
            'insurance_expires_on' => ['required', 'date', 'after:today'],
            'licence_document_path' => ['required', 'string'],
            'insurance_document_path' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'licence_expires_on.after' => 'Your licence must not be expired.',
            'insurance_expires_on.after' => 'Your insurance must not be expired.',
            'licence_document_path.required' => 'Please upload your licence document.',
            'insurance_document_path.required' => 'Please upload your insurance document.',
        ];
    }
}
