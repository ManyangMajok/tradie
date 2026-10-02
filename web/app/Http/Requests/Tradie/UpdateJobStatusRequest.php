<?php

namespace App\Http\Requests\Tradie;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'to_status' => ['required', 'string', 'in:tradie_on_the_way,in_progress,rescheduled'],
        ];
    }
}
