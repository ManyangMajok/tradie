import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Button } from '../../Components/ui/Button';
import { CheckCircle2, Star } from 'lucide-react';

interface TradiePlan {
    id: number;
    slug: string;
    name: string;
    yearly_price_cents: number;
    dispatch_rank_boost: number;
    featured_listing: boolean;
    stripe_price_id: string | null;
}

interface Props {
    plans: TradiePlan[];
    errors?: Record<string, string>;
}

function formatPrice(cents: number): string {
    return `KSh ${(cents / 100).toFixed(0)}/yr`;
}

export default function ActivateSubscription({ plans, errors = {} }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(plans[0]?.id ?? null);
    const [processing, setProcessing] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedId) return;
        setProcessing(true);
        router.post('/tradie/activate-subscription', { plan_id: selectedId }, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AuthLayout title="Activate your subscription" subtitle="Choose a plan to start receiving leads">
            <p className="mb-4 text-sm text-gray-600">Kenyan demo: KSh prices are illustrative placeholders. Payments are simulated.</p>
            <form onSubmit={submit}>
                <div className="space-y-3">
                    {plans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedId(plan.id)}
                            className={`w-full rounded-xl border-2 px-5 py-4 text-left transition-colors ${
                                selectedId === plan.id
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{plan.name}</span>
                                    {plan.featured_listing && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                            <Star className="h-3 w-3" /> Featured
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{formatPrice(plan.yearly_price_cents)}</span>
                                    {selectedId === plan.id && <CheckCircle2 className="h-5 w-5 text-brand-500" />}
                                </div>
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                <li>✓ Receive member job leads</li>
                                {plan.dispatch_rank_boost > 0 && <li>✓ Boosted dispatch ranking</li>}
                                {plan.featured_listing && <li>✓ Featured in search results</li>}
                            </ul>
                        </button>
                    ))}
                </div>

                {errors.plan_id && <p className="mt-3 text-sm text-red-600">{errors.plan_id}</p>}

                <Button type="submit" className="mt-6 w-full" loading={processing} disabled={!selectedId}>
                    Simulate payment
                </Button>

                <p className="mt-3 text-center text-xs text-gray-400">
                    Demo payment only. No card details or real charges.
                </p>
            </form>
        </AuthLayout>
    );
}
