import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface TradieOption {
    id: number;
    name: string;
    owner_name: string;
    rating: number | null;
}

interface StatusLog {
    id: number;
    from_status: string | null;
    to_status: string;
    changed_by_system: boolean;
    note: string | null;
    created_at: string;
    changed_by: { first_name: string; last_name: string } | null;
}

interface Job {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    description: string;
    requires_admin_review: boolean;
    submitted_at: string;
    assigned_at: string | null;
    completed_at: string | null;
    confirmed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    category: { name: string } | null;
    issue_type: { name: string } | null;
    custom_issue: string | null;
    property: { address_line_1: string; suburb: { name: string; postcode: string } | null } | null;
    member: { id: number; first_name: string; last_name: string; email: string; phone: string | null };
    assigned_company: { id: number; business_name: string; owner: { first_name: string; last_name: string; email: string; phone: string | null } } | null;
    status_logs: StatusLog[];
    completion_report: { invoice_total_cents: number; discount_applied: boolean; discount_amount_cents: number | null; notes: string | null } | null;
    review: { stars: number; review_text: string | null; work_completed_status: string; was_auto_confirmed: boolean } | null;
}

interface Props {
    job: Job;
    tradieCompanies: TradieOption[];
}

const STATUS_COLOURS: Record<string, string> = {
    pending_dispatch: 'bg-gray-100 text-gray-700',
    offered: 'bg-yellow-100 text-yellow-700',
    assigned: 'bg-blue-100 text-blue-700',
    tradie_on_the_way: 'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-teal-100 text-teal-700',
    confirmed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-500',
};

export default function JobShow({ job, tradieCompanies }: Props) {
    const [showAssign, setShowAssign] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    const assignForm = useForm({ tradie_company_id: '', note: '' });
    const cancelForm = useForm({ reason: '' });
    const redispatchForm = useForm({});

    const isActive = !['confirmed', 'cancelled'].includes(job.status);

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex items-start justify-between">
                <div>
                    <Link href="/admin/jobs" className="text-sm text-indigo-600 hover:underline">← All jobs</Link>
                    <h1 className="mt-1 text-2xl font-bold text-gray-900">{job.public_id}</h1>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLOURS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {job.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                    <h2 className="font-semibold text-gray-900">Job details</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex gap-2"><dt className="w-32 text-gray-500 shrink-0">Category</dt><dd>{job.category?.name ?? '—'}</dd></div>
                        <div className="flex gap-2"><dt className="w-32 text-gray-500 shrink-0">Issue</dt><dd>{job.issue_type?.name ?? job.custom_issue ?? '—'}</dd></div>
                        <div className="flex gap-2"><dt className="w-32 text-gray-500 shrink-0">Urgency</dt><dd>{job.urgency.replace(/_/g, ' ')}</dd></div>
                        <div className="flex gap-2"><dt className="w-32 text-gray-500 shrink-0">Address</dt><dd>{job.property?.address_line_1}, {job.property?.suburb?.name} {job.property?.suburb?.postcode}</dd></div>
                        <div className="flex gap-2"><dt className="w-32 text-gray-500 shrink-0">Submitted</dt><dd>{new Date(job.submitted_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</dd></div>
                    </dl>
                    {job.description && <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">{job.description}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">Member</h2>
                        <p className="text-sm text-gray-700 mt-1">{job.member.first_name} {job.member.last_name}</p>
                        <p className="text-sm text-gray-500">{job.member.email}</p>
                        {job.member.phone && <p className="text-sm text-gray-500">{job.member.phone}</p>}
                    </div>
                    {job.assigned_company && (
                        <div className="border-t border-gray-100 pt-4">
                            <h2 className="font-semibold text-gray-900">Assigned tradie</h2>
                            <p className="text-sm text-gray-700 mt-1">{job.assigned_company.business_name}</p>
                            <p className="text-sm text-gray-500">{job.assigned_company.owner.first_name} {job.assigned_company.owner.last_name}</p>
                            <p className="text-sm text-gray-500">{job.assigned_company.owner.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {(job.completion_report || job.review) && (
                <div className="grid gap-6 sm:grid-cols-2">
                    {job.completion_report && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                            <h2 className="font-semibold text-gray-900">Completion report</h2>
                            <dl className="space-y-1 text-sm">
                                <div className="flex gap-2"><dt className="w-40 text-gray-500">Work value</dt><dd>KSh {(job.completion_report.invoice_total_cents / 100).toFixed(2)}</dd></div>
                                <div className="flex gap-2"><dt className="w-40 text-gray-500">Discount applied</dt><dd>{job.completion_report.discount_applied ? `Yes — KSh ${((job.completion_report.discount_amount_cents ?? 0) / 100).toFixed(2)}` : 'No'}</dd></div>
                                {job.completion_report.notes && <div className="flex gap-2"><dt className="w-40 text-gray-500">Notes</dt><dd>{job.completion_report.notes}</dd></div>}
                            </dl>
                        </div>
                    )}
                    {job.review && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                            <h2 className="font-semibold text-gray-900">Review</h2>
                            <dl className="space-y-1 text-sm">
                                <div className="flex gap-2"><dt className="w-40 text-gray-500">Stars</dt><dd>{'★'.repeat(job.review.stars)}{'☆'.repeat(5 - job.review.stars)}</dd></div>
                                <div className="flex gap-2"><dt className="w-40 text-gray-500">Work completed</dt><dd>{job.review.work_completed_status.replace(/_/g, ' ')}</dd></div>
                                {job.review.was_auto_confirmed && <div className="text-xs text-gray-400 italic">Auto-confirmed</div>}
                                {job.review.review_text && <p className="text-gray-700 pt-1">{job.review.review_text}</p>}
                            </dl>
                        </div>
                    )}
                </div>
            )}

            {isActive && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold text-gray-900">Admin actions</h2>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setShowAssign(!showAssign)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Manually assign
                        </button>
                        <button
                            onClick={() => redispatchForm.post(`/admin/jobs/${job.public_id}/redispatch`)}
                            disabled={redispatchForm.processing}
                            className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Redispatch
                        </button>
                        <button onClick={() => setShowCancel(!showCancel)} className="rounded-lg bg-white border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                            Cancel job
                        </button>
                    </div>

                    {showAssign && (
                        <form onSubmit={(e) => { e.preventDefault(); assignForm.post(`/admin/jobs/${job.public_id}/assign`, { onSuccess: () => setShowAssign(false) }); }} className="space-y-3 border-t border-gray-100 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tradie company</label>
                                <select
                                    value={assignForm.data.tradie_company_id}
                                    onChange={(e) => assignForm.setData('tradie_company_id', e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select tradie…</option>
                                    {tradieCompanies.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} — {t.owner_name}{t.rating ? ` (★${t.rating})` : ''}</option>
                                    ))}
                                </select>
                                {assignForm.errors.tradie_company_id && <p className="mt-1 text-xs text-red-600">{assignForm.errors.tradie_company_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                                <input
                                    type="text"
                                    value={assignForm.data.note}
                                    onChange={(e) => assignForm.setData('note', e.target.value)}
                                    placeholder="e.g. Per phone call"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button type="submit" disabled={assignForm.processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                                Assign
                            </button>
                        </form>
                    )}

                    {showCancel && (
                        <form onSubmit={(e) => { e.preventDefault(); cancelForm.post(`/admin/jobs/${job.public_id}/cancel`, { onSuccess: () => setShowCancel(false) }); }} className="space-y-3 border-t border-gray-100 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                                <input
                                    type="text"
                                    value={cancelForm.data.reason}
                                    onChange={(e) => cancelForm.setData('reason', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <button type="submit" disabled={cancelForm.processing} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                                Confirm cancel
                            </button>
                        </form>
                    )}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Status history</h2>
                {job.status_logs.length === 0 ? (
                    <p className="text-sm text-gray-400">No history yet.</p>
                ) : (
                    <ol className="space-y-3">
                        {job.status_logs.map((log) => (
                            <li key={log.id} className="flex gap-4 text-sm">
                                <span className="text-gray-400 w-36 shrink-0">{new Date(log.created_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</span>
                                <span className="text-gray-700">
                                    {log.from_status ? `${log.from_status.replace(/_/g, ' ')} → ` : ''}<strong>{log.to_status.replace(/_/g, ' ')}</strong>
                                    {log.changed_by_system ? ' (system)' : log.changed_by ? ` by ${log.changed_by.first_name} ${log.changed_by.last_name}` : ''}
                                    {log.note ? ` — ${log.note}` : ''}
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
}

JobShow.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
