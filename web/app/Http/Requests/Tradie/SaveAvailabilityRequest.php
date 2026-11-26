<?php

namespace App\Http\Requests\Tradie;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class SaveAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Tradie;
    }

    public function rules(): array
    {
        return [
            'availability' => ['required', 'array', 'size:7'],
            'availability.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6', 'distinct'],
            'availability.*.is_open' => ['required', 'boolean'],
            'availability.*.opens_at' => ['nullable', 'required_if:availability.*.is_open,true', 'date_format:H:i'],
            'availability.*.closes_at' => ['nullable', 'required_if:availability.*.is_open,true', 'date_format:H:i', 'after:availability.*.opens_at'],
            'availability.*.accepts_emergency' => ['required', 'boolean'],
        ];
    }
}
