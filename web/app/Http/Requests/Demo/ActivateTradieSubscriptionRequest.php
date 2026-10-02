<?php

namespace App\Http\Requests\Demo;

use App\Enums\TradieCompanyStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivateTradieSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Tradie && $this->user()?->tradieCompany?->status === TradieCompanyStatus::Approved;
    }

    public function rules(): array
    {
        return ['plan_id' => ['required', 'integer', Rule::exists('tradie_plans', 'id')->where('is_active', true)]];
    }
}
