import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Job {
    id: number;
    public_id: string;
    status: string;
    submitted_at: string;
    category: { name: string } | null;
    property: { suburb: { name: string } | null } | null;
}

interface Tradie {
    id: number;
    business_name: string;
    trading_name: string | null;
    abn: string;
    licence_number: string;
    licence_state: string;
    licence_expires_on: string | null;
    insurance_expires_on: string | null;
    about_text: string | null;
    rating_average: number | null;
    rating_count: number;
    status: string;
    suspended_reason: string | null;
    approved_at: string | null;
    created_at: string;
    owner: { id: number; first_name: string; last_name: string; email: string; phone: string | null };
    active_subscription: { status: string; end_date: string; plan: { name: string } } | null;
    assigned_jobs: Job[];
}

interface Props {
    tradie: Tradie;
}

const STATUS_COLOURS: Record<string, string> = {
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    rejected: 'bg-gray-200 text-gray-500',
};

const JOB_STATUS_COLOURS: Record<string, string> = {
    assigned: 'bg-brand-100 text-brand-700',
    confirmed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-500',
    completed: 'bg-teal-100 text-teal-700',
};

export default function TradieShow({ tradie }: Props) {
    const suspendForm = useForm({ reason: '' });
    const reinstateForm = useForm({});
    const [showSuspend, setShowSuspend] = React.useState(false);

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <Link href="/admin/tradies" className="text-sm text-brand-600 hover:underline">← All tradies</Link>
                <div className="mt-1 flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{tradie.business_name}</h1>
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLOURS[tradie.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {tradie.status.replace(/_/g, ' ')}
                    </span>
                </div>
                {tradie.trading_name && <p className="text-sm text-gray-500">Trading as: {tradie.trading_name}</p>}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                    <h2 className="font-semibold text-gray-900">Business info</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex gap-2"><dt className="w-40 text-gray-500 shrink-0">Business registration</dt><dd>{tradie.abn}</dd></div>
                        <div className="flex gap-2"><dt className="w-40 text-gray-500 shrink-0">Licence</dt><dd>{tradie.licence_number} ({tradie.licence_state})</dd></div>
                        {tradie.licence_expires_on && <div className="flex gap-2"><dt className="w-40 text-gray-500 shrink-0">Licence expires</dt><dd>{tradie.licence_expires_on}</dd></div>}
                        {tradie.insurance_expires_on && <div className="flex gap-2"><dt className="w-40 text-gray-500 shrink-0">Insurance expires</dt><dd>{tradie.insurance_expires_on}</dd></div>}
                        {tradie.approved_at && <div className="flex gap-2"><dt className="w-40 text-gray-500 shrink-0">Approved</dt><dd>{new Date(tradie.approved_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}</dd></div>}
                    </dl>
                    {tradie.about_text && <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">{tradie.about_text}</p>}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">Owner</h2>
                        <p className="text-sm text-gray-700 mt-1">{tradie.owner.first_name} {tradie.owner.last_name}</p>
                        <p className="text-sm text-gray-500">{tradie.owner.email}</p>
                        {tradie.owner.phone && <p className="text-sm text-gray-500">{tradie.owner.phone}</p>}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h2 className="font-semibold text-gray-900">Subscription</h2>
                        {tradie.active_subscription ? (
                            <div className="text-sm mt-1 space-y-1">
                                <p className="text-gray-700">{tradie.active_subscription.plan.name} — <span className="text-green-600 font-medium">{tradie.active_subscription.status}</span></p>
                                <p className="text-gray-500">Renews {tradie.active_subscription.end_date}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 mt-1">No active subscription</p>
                        )}
                    </div>
                    <div className="border-t border-gray-100 pt-4">
                        <h2 className="font-semibold text-gray-900">Performance</h2>
                        <p className="text-sm text-gray-700 mt-1">
                            {tradie.rating_average != null
                                ? `★ ${tradie.rating_average.toFixed(1)} from ${tradie.rating_count} review${tradie.rating_count !== 1 ? 's' : ''}`
                                : 'No reviews yet'}
                        </p>
                    </div>
                </div>
            </div>

            {tradie.suspended_reason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <strong>Suspension reason:</strong> {tradie.suspended_reason}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Admin actions</h2>
                <div className="flex flex-wrap gap-3">
                    {tradie.status === 'suspended' ? (
                        <button
                            onClick={() => reinstateForm.post(`/admin/tradies/${tradie.id}/reinstate`)}
                            disabled={reinstateForm.processing}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            Reinstate
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowSuspend(!showSuspend)}
                            className="rounded-lg bg-white border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            Suspend
                        </button>
                    )}
                </div>

                {showSuspend && (
                    <form
                        onSubmit={(e) => { e.preventDefault(); suspendForm.post(`/admin/tradies/${tradie.id}/suspend`, { onSuccess: () => setShowSuspend(false) }); }}
                        className="space-y-3 border-t border-gray-100 pt-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                            <input
                                type="text"
                                value={suspendForm.data.reason}
                                onChange={(e) => suspendForm.setData('reason', e.target.value)}
                                required
                                maxLength={500}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            {suspendForm.errors.reason && <p className="mt-1 text-xs text-red-600">{suspendForm.errors.reason}</p>}
                        </div>
                        <button type="submit" disabled={suspendForm.processing} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                            Confirm suspend
                        </button>
                    </form>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Recent jobs (last 20)</h2>
                {tradie.assigned_jobs.length === 0 ? (
                    <p className="text-sm text-gray-400">No jobs yet.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="py-2 pr-4">Job</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Category</th>
                                <th className="py-2 pr-4">Area</th>
                                <th className="py-2">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tradie.assigned_jobs.map((job) => (
                                <tr key={job.id}>
                                    <td className="py-2 pr-4">
                                        <Link href={`/admin/jobs/${job.public_id}`} className="text-brand-600 hover:underline">{job.public_id}</Link>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${JOB_STATUS_COLOURS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                            {job.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">{job.category?.name ?? '—'}</td>
                                    <td className="py-2 pr-4 text-gray-600">{job.property?.suburb?.name ?? '—'}</td>
                                    <td className="py-2 text-gray-400">{new Date(job.submitted_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

TradieShow.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
