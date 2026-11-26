<?php

namespace App\Http\Requests\Member;

use App\Enums\PropertyType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Member;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:60'], 'address_line_1' => ['required', 'string', 'max:200'],
            'address_line_2' => ['nullable', 'string', 'max:200'],
            'suburb_id' => ['required', 'integer', Rule::exists('suburbs', 'id')->where('is_active', true)],
            'property_type' => ['required', Rule::enum(PropertyType::class)],
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
            'access_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
