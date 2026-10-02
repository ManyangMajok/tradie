<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\JobOffer;
use App\Models\User;

class JobOfferPolicy
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
        return $user->role === UserRole::Tradie;
    }

    public function view(User $user, JobOffer $offer): bool
    {
        return $user->role === UserRole::Tradie
            && $offer->tradie_company_id === $user->tradieCompany?->id;
    }

    public function accept(User $user, JobOffer $offer): bool
    {
        return $user->role === UserRole::Tradie
            && $offer->tradie_company_id === $user->tradieCompany?->id;
    }

    public function decline(User $user, JobOffer $offer): bool
    {
        return $user->role === UserRole::Tradie
            && $offer->tradie_company_id === $user->tradieCompany?->id;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, JobOffer $offer): bool
    {
        return false;
    }

    public function delete(User $user, JobOffer $offer): bool
    {
        return false;
    }
}
