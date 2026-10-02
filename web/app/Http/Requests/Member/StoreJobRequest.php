<?php

namespace App\Http\Requests\Member;

use App\Enums\Urgency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'property_id' => ['required', 'integer', Rule::exists('properties', 'id')->where('member_user_id', $userId)->whereNull('deleted_at')],
            'tradie_category_id' => ['required', 'integer', Rule::exists('tradie_categories', 'id')->where('is_active', true)],
            'issue_type_id' => ['nullable', 'integer', Rule::exists('issue_types', 'id')],
            'custom_issue' => ['nullable', 'string', 'max:200', 'required_without:issue_type_id'],
            'urgency' => ['required', Rule::enum(Urgency::class)],
            'description' => ['required', 'string', 'min:10', 'max:2000'],
            'best_contact_time' => ['nullable', 'string', 'max:100'],
            'image_ids' => ['nullable', 'array', 'max:10'],
            'image_ids.*' => ['integer', Rule::exists('job_images', 'id')->where('uploaded_by_user_id', $userId)->whereNull('job_id')],
        ];
    }
}
