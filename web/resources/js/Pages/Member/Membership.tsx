import React, { useState } from 'react';
import MemberLayout from '../../Layouts/MemberLayout';
import { router, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader } from '../../Components/ui/Card';
import { Button } from '../../Components/ui/Button';
import { MemberPlan, MemberSubscription, SubscriptionStatus } from '../../Types/domain';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Props {
    subscription: MemberSubscription | null;
    plans: MemberPlan[];
}

const statusConfig: Record<SubscriptionStatus, { label: string; colour: string; icon: React.ReactNode }> = {
    active: { label: 'Active', colour: 'text-green-700 bg-green-50', icon: <CheckCircle2 className="h-4 w-4" /> },
    past_due: { label: 'Payment overdue', colour: 'text-yellow-700 bg-yellow-50', icon: <AlertCircle className="h-4 w-4" /> },
    canceled: { label: 'Cancelled', colour: 'text-gray-600 bg-gray-100', icon: <XCircle className="h-4 w-4" /> },
    incomplete: { label: 'Incomplete', colour: 'text-orange-700 bg-orange-50', icon: <AlertCircle className="h-4 w-4" /> },
    paused: { label: 'Paused', colour: 'text-blue-700 bg-blue-50', icon: <AlertCircle className="h-4 w-4" /> },
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(cents: number): string {
    return `KSh ${(cents / 100).toFixed(0)}/yr`;
}

export default function Membership({ subscription, plans }: Props) {
    const [cancelling, setCancelling] = useState(false);

    function handleCancel() {
        if (!confirm('Are you sure you want to cancel your membership? It will remain active until the end of your billing period.')) return;
        setCancelling(true);
        router.post('/membership/cancel', {}, { onFinish: () => setCancelling(false) });
    }

    const status = subscription ? statusConfig[subscription.status] : null;

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">Membership</h1>

            {subscription ? (
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{subscription.plan.name}</span>
                            {status && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.colour}`}>
                                    {status.icon}
                                    {status.label}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody>
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Price</dt>
                                <dd className="font-medium text-gray-900">{formatPrice(subscription.plan.yearly_price_cents)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Started</dt>
                                <dd className="font-medium text-gray-900">{formatDate(subscription.start_date)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Renews</dt>
                                <dd className="font-medium text-gray-900">
                                    {subscription.auto_renew ? formatDate(subscription.end_date) : 'Not renewing'}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/membership/portal"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Manage billing
                            </Link>
                            {subscription.status === 'active' && subscription.auto_renew && (
                                <Button
                                    onClick={handleCancel}
                                    variant="ghost"
                                    size="sm"
                                    loading={cancelling}
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    Cancel membership
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            ) : (
                <div className="mt-6">
                    <p className="text-gray-600">You don't have an active membership. Choose a plan below.</p>
                    <div className="mt-4 space-y-3">
                        {plans.map((plan) => (
                            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900">{plan.name}</span>
                                    <span className="text-sm text-gray-500">{formatPrice(plan.yearly_price_cents)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

Membership.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
