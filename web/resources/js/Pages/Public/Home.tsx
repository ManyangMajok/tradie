import React from 'react';
import { Logo } from '../../Components/ui/Logo';

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
            <Logo size="lg" showTagline />
            <p className="mt-6 max-w-md text-lg text-gray-500">
                Trusted local fundis across Kenya. No call-out fees. Member discounts.
            </p>
            <div className="mt-8 flex gap-4">
                <a href="/register/member" className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-base font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                    Become a Member
                </a>
                <a href="/login" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                    Sign In
                </a>
            </div>
        </div>
    );
}
