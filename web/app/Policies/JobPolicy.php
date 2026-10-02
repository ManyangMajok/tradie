<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Job;
use App\Models\User;

class JobPolicy
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

    public function view(User $user, Job $job): bool
    {
        if ($user->role === UserRole::Member) {
            return $job->member_user_id === $user->id;
        }

        if ($user->role === UserRole::Tradie) {
            return $job->assigned_tradie_company_id === $user->tradieCompany?->id
                || $job->offers()->where('tradie_company_id', $user->tradieCompany?->id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Member;
    }

    public function update(User $user, Job $job): bool
    {
        return false;
    }

    public function delete(User $user, Job $job): bool
    {
        return false;
    }

    public function cancel(User $user, Job $job): bool
    {
        if ($user->role === UserRole::Member) {
            return $job->member_user_id === $user->id;
        }

        return false;
    }
}
