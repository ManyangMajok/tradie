<?php

namespace App\Http\Requests\Admin;

use App\Support\CrudResources;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage-records') ?? false;
    }

    public function rules(): array
    {
        $resource = $this->route('resource');
        $id = $this->route('record');
        $rules = [];
        foreach (CrudResources::definition($resource)['fields'] as $field) {
            $name = $field['name'];
            $rule = [$field['required'] ? 'required' : 'nullable'];
            if ($resource === 'locations' && in_array($name, ['latitude', 'longitude'])) {
                $other = $name === 'latitude' ? 'longitude' : 'latitude';
                $limit = $name === 'latitude' ? 90 : 180;
                $rule = ['nullable', 'required_with:'.$other, 'numeric', 'between:-'.$limit.','.$limit];
            } elseif ($field['type'] === 'checkbox') {
                $rule = ['required', 'boolean'];
            } elseif ($field['type'] === 'number') {
                $rule = array_merge($rule, ['integer', 'min:0', 'max:10000']);
            } elseif (isset($field['reference'])) {
                $reference = $field['reference'];
                $table = match ($reference) {
                    'members','fundis' => 'users','locations' => 'suburbs','categories' => 'tradie_categories','tradies' => 'tradie_companies',default => $reference
                };
                $exists = Rule::exists($table, 'id');
                if (in_array($table, ['users', 'properties', 'tradie_companies'])) {
                    $exists->whereNull('deleted_at');
                }
                if (in_array($reference, ['members', 'fundis'])) {
                    $exists->where('role', $reference === 'members' ? 'member' : 'tradie');
                }
                $rule = array_merge($rule, ['integer', $exists]);
            } elseif (isset($field['choices'])) {
                $rule[] = Rule::in(array_keys($field['choices']));
            } else {
                $rule[] = 'string';
                $rule[] = 'max:'.($field['max'] ?? 255);
                if ($field['type'] === 'email') {
                    $rule[] = 'email';
                }
            }
            if ($name === 'slug') {
                $rule[] = 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
            }
            $rules[$name] = $rule;
        }
        if (in_array($resource, ['people', 'fundis'])) {
            foreach (['email', 'phone'] as $field) {
                $rules[$field][] = Rule::unique('users', $field)->whereNull('deleted_at')->ignore($id);
            }
            if ($resource === 'people') {
                $rules['password'] = [$id ? 'nullable' : 'required', 'string', 'min:8', 'max:128'];
            }
        }
        if ($resource === 'fundis') {
            $existingBusiness = $id ? CrudResources::query('fundis')->findOrFail($id)->tradieCompany : null;
            $rules['business_name'] = [Rule::requiredIf(($existingBusiness !== null && ! $existingBusiness->is_independent) || $this->filled('trading_name') || $this->filled('abn') || $this->filled('about_text')), 'nullable', 'string', 'max:200'];
        }
        if ($resource === 'tradies') {
            $rules['owner_user_id'][] = Rule::unique('tradie_companies', 'owner_user_id')->whereNull('deleted_at')->ignore($id);
        }
        if ($resource === 'categories') {
            $rules['slug'][] = Rule::unique('tradie_categories', 'slug')->ignore($id);
        }
        if ($resource === 'issue-types') {
            $rules['slug'][] = Rule::unique('issue_types', 'slug')->where('tradie_category_id', $this->input('tradie_category_id'))->ignore($id);
        }
        if ($resource === 'locations') {
            $rules['name'][] = Rule::unique('suburbs', 'name')->where('postcode', $this->input('postcode'))->where('state', $this->input('state'))->ignore($id);
        }

        return $rules;
    }
}
