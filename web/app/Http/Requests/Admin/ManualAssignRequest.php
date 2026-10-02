<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ManualAssignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tradie_company_id' => ['required', 'integer', 'exists:tradie_companies,id'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
