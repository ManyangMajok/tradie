<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\MemberSubscription;
use App\Models\User;

class MemberSubscriptionPolicy
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

    public function view(User $user, MemberSubscription $subscription): bool
    {
        return $user->role === UserRole::Member && $subscription->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Member;
    }

    public function update(User $user, MemberSubscription $subscription): bool
    {
        return false;
    }

    public function delete(User $user, MemberSubscription $subscription): bool
    {
        return false;
    }
}
