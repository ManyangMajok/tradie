import React, { useState } from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Button } from '../../../Components/ui/Button';

interface Suburb { name: string; }
interface Property { address_line_1: string; suburb: Suburb; }
interface Category { name: string; }

interface Job {
    id: number;
    public_id: string;
    category: Category;
    property: Property;
}

interface Props { job: Job; }

export default function TradieJobComplete({ job }: Props) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        summary_of_work: '',
        invoice_total_dollars: '',
        no_callout_fee_confirmed: false as boolean,
        discount_applied: false as boolean,
        discount_amount_dollars: '',
        completion_notes: '',
    });

    function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const invoiceCents = Math.round(parseFloat(form.invoice_total_dollars || '0') * 100);
        const discountCents = form.discount_applied && form.discount_amount_dollars
            ? Math.round(parseFloat(form.discount_amount_dollars) * 100)
            : null;

        setProcessing(true);
        router.post(`/tradie/jobs/${job.public_id}/complete`, {
            summary_of_work:          form.summary_of_work,
            invoice_total_cents:      invoiceCents,
            no_callout_fee_confirmed: form.no_callout_fee_confirmed,
            discount_applied:         form.discount_applied,
            discount_amount_cents:    discountCents,
            completion_notes:         form.completion_notes || null,
        }, {
            onSuccess: () => router.visit(`/tradie/jobs/${job.public_id}`),
            onError: (errs) => setErrors(errs as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="mx-auto max-w-lg">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Mark job complete</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {job.category.name} — {job.property.address_line_1}, {job.property.suburb.name}
                </p>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardBody className="space-y-5">
                        {/* Summary of work */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Summary of work <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
                                rows={4}
                                placeholder="Describe what was done…"
                                value={form.summary_of_work}
                                onChange={(e) => update('summary_of_work', e.target.value)}
                            />
                            {errors.summary_of_work && (
                                <p className="mt-1 text-xs text-red-500">{errors.summary_of_work}</p>
                            )}
                        </div>

                        {/* Invoice total */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Invoice total (KES) <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-gray-500">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                                    placeholder="0.00"
                                    value={form.invoice_total_dollars}
                                    onChange={(e) => update('invoice_total_dollars', e.target.value)}
                                />
                            </div>
                            {errors.invoice_total_cents && (
                                <p className="mt-1 text-xs text-red-500">{errors.invoice_total_cents}</p>
                            )}
                        </div>

                        {/* No call-out fee */}
                        <label className="flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-0.5 accent-brand-500"
                                checked={form.no_callout_fee_confirmed}
                                onChange={(e) => update('no_callout_fee_confirmed', e.target.checked)}
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-700">No call-out fee charged</span>
                                <p className="text-xs text-gray-400">Confirm you waived the call-out fee for this member</p>
                            </div>
                        </label>

                        {/* Discount applied */}
                        <label className="flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                className="mt-0.5 accent-brand-500"
                                checked={form.discount_applied}
                                onChange={(e) => update('discount_applied', e.target.checked)}
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-700">Member discount applied</span>
                                <p className="text-xs text-gray-400">Confirm you applied the member discount</p>
                            </div>
                        </label>

                        {/* Discount amount (conditional) */}
                        {form.discount_applied && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Discount amount (KES) <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-sm text-gray-500">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
                                        placeholder="0.00"
                                        value={form.discount_amount_dollars}
                                        onChange={(e) => update('discount_amount_dollars', e.target.value)}
                                    />
                                </div>
                                {errors.discount_amount_cents && (
                                    <p className="mt-1 text-xs text-red-500">{errors.discount_amount_cents}</p>
                                )}
                            </div>
                        )}

                        {/* Completion notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Completion notes (optional)</label>
                            <textarea
                                className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
                                rows={2}
                                placeholder="Any follow-up notes for the member…"
                                value={form.completion_notes}
                                onChange={(e) => update('completion_notes', e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" loading={processing}>
                            Submit completion report
                        </Button>
                    </CardBody>
                </Card>
            </form>
        </div>
    );
}

TradieJobComplete.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
