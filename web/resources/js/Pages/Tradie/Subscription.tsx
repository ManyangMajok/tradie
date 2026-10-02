import React from 'react';
import { router } from '@inertiajs/react';
import TradieLayout from '../../Layouts/TradieLayout';
import { CreditCard, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Plan {
    name: string;
    yearly_price_cents: number;
    dispatch_rank_boost: number;
    featured_listing: boolean;
}

interface Subscription {
    status: string;
    plan: Plan;
    start_date: string | null;
    end_date: string | null;
    auto_renew: boolean;
    canceled_at: string | null;
}

interface Props {
    subscription: Subscription | null;
    has_stripe_customer: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
    active:   { label: 'Active',   icon: CheckCircle,  colour: 'text-green-600' },
    past_due: { label: 'Past due', icon: AlertCircle,  colour: 'text-yellow-600' },
    expired:  { label: 'Expired',  icon: XCircle,      colour: 'text-red-600' },
    cancelled:{ label: 'Cancelled',icon: XCircle,      colour: 'text-gray-500' },
};

export default function Subscription({ subscription, has_stripe_customer }: Props) {
    if (!subscription) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-700">No active subscription</p>
                    <p className="mt-1 text-xs text-gray-400">You need an active subscription to receive leads.</p>
                    <button
                        onClick={() => router.visit('/tradie/activate-subscription')}
                        className="mt-4 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                    >
                        Choose a plan
                    </button>
                </div>
            </div>
        );
    }

    const cfg = statusConfig[subscription.status] ?? statusConfig['active'];
    const StatusIcon = cfg.icon;
    const yearlyPrice = (subscription.plan.yearly_price_cents / 100).toLocaleString('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
    });

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500">Plan</p>
                        <p className="mt-0.5 text-lg font-bold text-gray-900">{subscription.plan.name}</p>
                        <p className="text-sm text-gray-500">{yearlyPrice} / year</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.colour}`}>
                        <StatusIcon className="h-4 w-4" />
                        {cfg.label}
                    </span>
                </div>

                <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500">Start date</p>
                        <p className="mt-0.5 font-medium text-gray-900">{subscription.start_date ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Renewal date</p>
                        <p className="mt-0.5 font-medium text-gray-900">{subscription.end_date ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Auto-renew</p>
                        <p className="mt-0.5 font-medium text-gray-900">{subscription.auto_renew ? 'On' : 'Off'}</p>
                    </div>
                    {subscription.canceled_at && (
                        <div>
                            <p className="text-xs text-gray-500">Cancelled on</p>
                            <p className="mt-0.5 font-medium text-gray-900">
                                {new Date(subscription.canceled_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500">Dispatch rank boost</p>
                        <p className="mt-0.5 font-medium text-gray-900">+{subscription.plan.dispatch_rank_boost}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Featured listing</p>
                        <p className="mt-0.5 font-medium text-gray-900">{subscription.plan.featured_listing ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>

            {has_stripe_customer && (
                <div className="mt-4">
                    <button
                        onClick={() => router.visit('/tradie/subscription/portal')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <CreditCard className="h-4 w-4" />
                        Manage billing
                    </button>
                </div>
            )}
        </div>
    );
}

Subscription.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
