import React from 'react';
import { usePage } from '@inertiajs/react';
import { Logo } from '../Components/ui/Logo';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { flash } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="mb-8 text-center">
                <a href="/" className="inline-flex">
                    <Logo size="lg" />
                </a>
                {title && <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>

            {flash.success && (
                <div className="mb-4 w-full max-w-md rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="mb-4 w-full max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
