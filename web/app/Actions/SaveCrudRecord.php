<?php

namespace App\Actions;

use App\Models\Job;
use App\Models\Property;
use App\Models\TradieCompany;
use App\Support\CrudResources;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class SaveCrudRecord
{
    public function execute(string $resource, array $data, ?int $id = null): Model
    {
        return DB::transaction(function () use ($resource, $data, $id) {
            $model = CrudResources::definition($resource)['model'];
            $record = $id ? CrudResources::query($resource)->lockForUpdate()->findOrFail($id) : new $model;
            if ($resource === 'fundis') {
                $business = array_intersect_key($data, array_flip(['business_name', 'trading_name', 'abn', 'about_text']));
                $contact = array_intersect_key($data, array_flip(['first_name', 'last_name', 'email', 'phone', 'status']));
                $contact['role'] = 'tradie';
                if (! $id) {
                    $contact['password'] = Str::random(48);
                }
                $record->fill($contact)->save();
                if (! empty($business['business_name'])) {
                    $company = TradieCompany::where('owner_user_id', $record->id)->lockForUpdate()->first();
                    if (! $company) {
                        $company = new TradieCompany(['owner_user_id' => $record->id]);
                    }
                    $company->fill($business)->save();
                }

                return $record;
            }
            if ($resource === 'people') {
                if (empty($data['password'])) {
                    unset($data['password']);
                }
                if ($id && $record->role->value !== $data['role'] && (Property::withTrashed()->where('member_user_id', $id)->exists() || TradieCompany::withTrashed()->where('owner_user_id', $id)->exists() || Job::where('member_user_id', $id)->exists())) {
                    throw ValidationException::withMessages(['role' => 'Remove related properties, jobs and businesses before changing this role.']);
                }
            }
            if ($resource === 'properties' && $id && $record->member_user_id != $data['member_user_id'] && $record->jobs()->exists()) {
                throw ValidationException::withMessages(['member_user_id' => 'A property with jobs cannot be transferred to another member.']);
            }
            if ($resource === 'jobs') {
                $property = Property::lockForUpdate()->findOrFail($data['property_id']);
                $data['member_user_id'] = $property->member_user_id;
                foreach (['in_progress' => 'started_at', 'completed' => 'completed_at', 'cancelled' => 'cancelled_at'] as $status => $column) {
                    $data[$column] = $data['status'] === $status ? ($record->$column ?? now()) : null;
                }
                $data['assigned_at'] = ! empty($data['assigned_tradie_company_id']) ? ($record->assigned_at ?? now()) : null;
                $data['requires_admin_review'] = false;
            }
            $record->fill($data)->save();

            return $record;
        });
    }
}
