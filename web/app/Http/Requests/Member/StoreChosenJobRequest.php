<?php

namespace App\Http\Requests\Member;

class StoreChosenJobRequest extends StoreJobRequest
{
    public function rules(): array
    {
        return [...parent::rules(), 'selected_tradie_company_id' => ['required', 'integer', 'exists:tradie_companies,id']];
    }
}
