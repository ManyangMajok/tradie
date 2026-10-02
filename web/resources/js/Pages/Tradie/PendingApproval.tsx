import React from 'react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
    return (
        <AuthLayout title="Application under review">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                    <Clock className="h-7 w-7 text-brand-500" />
                </div>
                <p className="text-sm text-gray-600">
                    Our team is reviewing your application. We'll send you an email once it's been approved — usually within 1 business day.
                </p>
                <p className="mt-6 text-center text-sm text-gray-500">
                    <Link href="/logout" method="post" as="button" className="text-brand-500 hover:underline">
                        Sign out
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
