import React from 'react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';

export default function MembershipRequired() {
    return (
        <AuthLayout title="Membership required">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50">
                    <ShieldOff className="h-7 w-7 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600">
                    Your membership is inactive or has expired. Renew to access member benefits and book tradies.
                </p>
                <Link
                    href="/membership"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                    View membership options
                </Link>
                <p className="mt-4 text-center text-sm text-gray-500">
                    <Link href="/logout" method="post" as="button" className="text-brand-500 hover:underline">
                        Sign out
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
