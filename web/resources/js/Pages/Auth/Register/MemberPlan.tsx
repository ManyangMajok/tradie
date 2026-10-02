import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthLayout from '../../../Layouts/AuthLayout';
import { Button } from '../../../Components/ui/Button';
import { MemberPlan } from '../../../Types/domain';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    plans: MemberPlan[];
    errors?: Record<string, string>;
}

function formatPrice(cents: number): string {
    return `KSh ${(cents / 100).toFixed(0)}/yr`;
}

export default function MemberPlanPage({ plans, errors = {} }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(plans[0]?.id ?? null);
    const [processing, setProcessing] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedId) return;
        setProcessing(true);
        router.post('/register/member/plan', { plan_id: selectedId }, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AuthLayout title="Choose your plan" subtitle="Step 3 of 3 — Select a membership">
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
                                <div>
                                    <span className="font-semibold text-gray-900">{plan.name}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        {formatPrice(plan.yearly_price_cents)}
                                    </span>
                                </div>
                                {selectedId === plan.id && (
                                    <CheckCircle2 className="h-5 w-5 text-brand-500" />
                                )}
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                <li>✓ No call-out fees</li>
                                {plan.includes_discount && (
                                    <li>✓ {plan.discount_percent}% member discount</li>
                                )}
                                <li>
                                    ✓ Up to{' '}
                                    {plan.max_properties === null
                                        ? 'unlimited'
                                        : plan.max_properties}{' '}
                                    {plan.max_properties === 1 ? 'property' : 'properties'}
                                </li>
                                {plan.priority_dispatch && <li>✓ Priority dispatch</li>}
                            </ul>
                        </button>
                    ))}
                </div>

                {errors.plan_id && (
                    <p className="mt-3 text-sm text-red-600">{errors.plan_id}</p>
                )}

                <Button
                    type="submit"
                    className="mt-6 w-full"
                    loading={processing}
                    disabled={!selectedId}
                >
                    Simulate payment
                </Button>

                <p className="mt-3 text-center text-xs text-gray-400">
                    Demo payment only. No card details or real charges.
                </p>
            </form>
        </AuthLayout>
    );
}
