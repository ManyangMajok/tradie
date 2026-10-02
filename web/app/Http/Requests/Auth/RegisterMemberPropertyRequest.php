<?php

namespace App\Http\Requests\Auth;

use App\Enums\PropertyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterMemberPropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:60'],
            'address_line_1' => ['required', 'string', 'max:200'],
            'address_line_2' => ['nullable', 'string', 'max:200'],
            'suburb_id' => ['required', 'integer', 'exists:suburbs,id'],
            'property_type' => ['required', Rule::enum(PropertyType::class)],
            'gate_code' => ['nullable', 'string', 'max:60'],
            'access_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
