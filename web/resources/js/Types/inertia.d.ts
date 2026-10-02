import { AuthUser } from './domain';

declare module '@inertiajs/core' {
    interface PageProps {
        auth: {
            user: AuthUser | null;
        };
        flash: {
            success: string | null;
            error: string | null;
        };
        reverb: {
            key: string;
            host: string;
            port: number;
            scheme: string;
        };
    }
}
