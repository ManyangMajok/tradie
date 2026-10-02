<?php

namespace App\Http\Requests\Demo;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActivateMemberSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Member;
    }

    public function rules(): array
    {
        return ['plan_id' => ['required', 'integer', Rule::exists('member_plans', 'id')->where('is_active', true)]];
    }
}
