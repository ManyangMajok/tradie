import React from 'react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Link } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';

export default function SubscriptionRequired() {
    return (
        <AuthLayout title="Subscription required">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50">
                    <CreditCard className="h-7 w-7 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600">
                    Your application has been approved. Subscribe to a tradie plan to start receiving leads.
                </p>
                <Link
                    href="/tradie/activate-subscription"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                >
                    Choose a plan
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
