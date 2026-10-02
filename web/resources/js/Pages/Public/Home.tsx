import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '../../Components/ui/Button';

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Tradify</h1>
            <p className="mt-4 text-lg text-gray-500">
                Trusted tradies. No call-out fees. Member discounts.
            </p>
            <div className="mt-8 flex gap-4">
                <Link href="/register/member">
                    <Button size="lg">Become a Member</Button>
                </Link>
                <Link href="/login">
                    <Button variant="secondary" size="lg">Sign In</Button>
                </Link>
            </div>
        </div>
    );
}
