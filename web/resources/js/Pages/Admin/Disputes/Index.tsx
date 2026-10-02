import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Review {
    stars: number;
    review_text: string | null;
    work_completed_status: string;
}

interface Dispute {
    id: number;
    public_id: string;
    description: string;
    updated_at: string;
    category: { name: string } | null;
    property: { suburb: { name: string } | null } | null;
    member: { first_name: string; last_name: string };
    assigned_company: { id: number; business_name: string } | null;
    review: Review | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    disputes: Paginated<Dispute>;
}

interface ResolveFormData {
    resolution: string;
    action_on_tradie: string;
    issue_member_credit_cents: string;
    note: string;
}

function ResolvePanel({ job }: { job: Dispute }) {
    const form = useForm<ResolveFormData>({
        resolution: '',
        action_on_tradie: 'none',
        issue_member_credit_cents: '',
        note: '',
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const data: Record<string, string | number | null> = {
                    resolution: form.data.resolution,
                    action_on_tradie: form.data.action_on_tradie,
                    note: form.data.note || null,
                    issue_member_credit_cents: form.data.issue_member_credit_cents
                        ? Math.round(parseFloat(form.data.issue_member_credit_cents) * 100)
                        : null,
                };
                form.transform(() => data);
                form.post(`/admin/disputes/${job.id}/resolve`);
            }}
            className="mt-4 space-y-4 border-t border-gray-100 pt-4"
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                    <select
                        value={form.data.resolution}
                        onChange={(e) => form.setData('resolution', e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select…</option>
                        <option value="tradie_at_fault">Tradie at fault</option>
                        <option value="member_at_fault">Member at fault</option>
                        <option value="no_fault">No fault</option>
                        <option value="split">Split</option>
                    </select>
                    {form.errors.resolution && <p className="mt-1 text-xs text-red-600">{form.errors.resolution}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action on tradie</label>
                    <select
                        value={form.data.action_on_tradie}
                        onChange={(e) => form.setData('action_on_tradie', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="none">None</option>
                        <option value="warn">Warn</option>
                        <option value="suspend_7d">Suspend 7 days</option>
                        <option value="suspend_indefinite">Suspend indefinitely</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member credit ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data.issue_member_credit_cents}
                        onChange={(e) => form.setData('issue_member_credit_cents', e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <input
                        type="text"
                        value={form.data.note}
                        onChange={(e) => form.setData('note', e.target.value)}
                        maxLength={1000}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={form.processing || !form.data.resolution}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
                Resolve dispute
            </button>
        </form>
    );
}

export default function DisputesIndex({ disputes }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
                <span className="text-sm text-gray-500">{disputes.meta?.total ?? disputes.data.length} open</span>
            </div>

            {disputes.data.length === 0 ? (
                <p className="text-sm text-gray-500">No open disputes.</p>
            ) : (
                <div className="space-y-4">
                    {disputes.data.map((job) => (
                        <div key={job.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <Link href={`/admin/jobs/${job.public_id}`} className="font-semibold text-indigo-600 hover:underline">
                                            {job.public_id}
                                        </Link>
                                        <span className="ml-2 text-sm text-gray-500">{job.category?.name ?? '—'} · {job.property?.suburb?.name ?? '—'}</span>
                                        <p className="mt-1 text-sm text-gray-700">
                                            Member: {job.member.first_name} {job.member.last_name}
                                            {job.assigned_company && ` · Tradie: ${job.assigned_company.business_name}`}
                                        </p>
                                        {job.review && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                <span>{'★'.repeat(job.review.stars)}{'☆'.repeat(5 - job.review.stars)}</span>
                                                <span className="ml-2 text-gray-500">{job.review.work_completed_status.replace(/_/g, ' ')}</span>
                                                {job.review.review_text && <p className="mt-1 italic text-gray-500">"{job.review.review_text}"</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-gray-400">{new Date(job.updated_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}</p>
                                        <button
                                            onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                                            className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                        >
                                            {expanded === job.id ? 'Close' : 'Resolve'}
                                        </button>
                                    </div>
                                </div>

                                {expanded === job.id && <ResolvePanel job={job} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {disputes.links && disputes.data.length > 0 && (
                <div className="flex gap-1 justify-center flex-wrap">
                    {disputes.links.map((link, i) => (
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                className={`px-3 py-1.5 rounded text-sm border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span key={i} className="px-3 py-1.5 rounded text-sm border border-gray-200 text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

DisputesIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
