<?php

namespace App\Http\Requests\Member;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveTradieRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Member;
    }

    public function rules(): array
    {
        return ['tradie_company_id' => ['required', 'integer', Rule::exists('tradie_companies', 'id')->whereNull('deleted_at')->where('status', 'approved')]];
    }
}
