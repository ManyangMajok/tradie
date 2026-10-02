import { usePage } from '@inertiajs/react';
import { AuthUser } from '../Types/domain';

export function useAuth(): { user: AuthUser | null } {
    const { auth } = usePage().props;
    return { user: auth.user };
}
