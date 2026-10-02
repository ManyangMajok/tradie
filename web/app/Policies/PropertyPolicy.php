<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Property;
use App\Models\User;

class PropertyPolicy
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
        return $user->role === UserRole::Member;
    }

    public function view(User $user, Property $property): bool
    {
        return $user->role === UserRole::Member && $property->member_user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Member;
    }

    public function update(User $user, Property $property): bool
    {
        return $user->role === UserRole::Member && $property->member_user_id === $user->id;
    }

    public function delete(User $user, Property $property): bool
    {
        return $user->role === UserRole::Member && $property->member_user_id === $user->id;
    }
}
