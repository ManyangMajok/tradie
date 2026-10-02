<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterTradieStep4Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agreed_terms' => ['required', 'accepted'],
            'agreed_conduct' => ['required', 'accepted'],
            'agreed_background_check' => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'agreed_terms.accepted' => 'You must agree to the terms and conditions.',
            'agreed_conduct.accepted' => 'You must agree to the code of conduct.',
            'agreed_background_check.accepted' => 'You must consent to a background check.',
        ];
    }
}
