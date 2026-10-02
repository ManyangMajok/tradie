<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ResolveDisputeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resolution' => ['required', 'string', 'in:tradie_at_fault,member_at_fault,no_fault,split'],
            'action_on_tradie' => ['required', 'string', 'in:none,warn,suspend_7d,suspend_indefinite'],
            'issue_member_credit_cents' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
