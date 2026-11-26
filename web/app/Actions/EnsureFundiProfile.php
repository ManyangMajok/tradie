<?php

namespace App\Actions;

use App\Models\TradieCompany;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class EnsureFundiProfile
{
    public function execute(User $user): TradieCompany
    {
        return DB::transaction(function () use ($user) {
            $owner = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            return TradieCompany::firstOrCreate(['owner_user_id' => $owner->id], [
                'business_name' => trim("$owner->first_name $owner->last_name"),
                'is_independent' => true, 'status' => 'approved',
            ]);
        });
    }
}
