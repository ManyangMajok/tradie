<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\TradieCompany;
use App\Models\User;

class TradieCompanyPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, TradieCompany $company): bool
    {
        return $user->role === UserRole::Tradie && $company->owner_user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Tradie;
    }

    public function update(User $user, TradieCompany $company): bool
    {
        return $user->role === UserRole::Tradie && $company->owner_user_id === $user->id;
    }

    public function delete(User $user, TradieCompany $company): bool
    {
        return false;
    }
}
