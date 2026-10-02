import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export function useFlash(): { success: string | null; error: string | null } {
    const { flash } = usePage().props;
    return { success: flash.success, error: flash.error };
}

export function useToast() {
    const { success, error } = useFlash();

    useEffect(() => {
        // Extend with a toast library in Phase 2 if needed.
        // Flash messages are rendered by the layout for now.
    }, [success, error]);

    return { success, error };
}
