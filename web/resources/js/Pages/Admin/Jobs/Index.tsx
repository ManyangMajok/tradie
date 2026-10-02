import React from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Job {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    requires_admin_review: boolean;
    submitted_at: string;
    category: { name: string } | null;
    property: { suburb: { name: string } | null } | null;
    member: { first_name: string; last_name: string };
    assigned_company: { business_name: string } | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Filters {
    status?: string;
    urgency?: string;
    q?: string;
    from_date?: string;
    to_date?: string;
}

interface Props {
    jobs: Paginated<Job>;
    filters: Filters;
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
    rescheduled: 'bg-orange-100 text-orange-700',
    awaiting_client_response: 'bg-yellow-100 text-yellow-700',
};

const JOB_STATUSES = [
    'pending_dispatch', 'offered', 'assigned', 'tradie_on_the_way',
    'in_progress', 'awaiting_client_response', 'rescheduled',
    'completed', 'confirmed', 'disputed', 'cancelled',
];

export default function JobsIndex({ jobs, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get('/admin/jobs', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
                <span className="text-sm text-gray-500">{jobs.meta?.total ?? jobs.data.length} total</span>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Search job ID or description…"
                    defaultValue={filters.q}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    onBlur={(e) => applyFilter('q', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilter('q', (e.target as HTMLInputElement).value)}
                />
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All statuses</option>
                    {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <select
                    value={filters.urgency ?? ''}
                    onChange={(e) => applyFilter('urgency', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All urgencies</option>
                    <option value="same_day">Same day</option>
                    <option value="next_day">Next day</option>
                    <option value="this_week">This week</option>
                    <option value="flexible">Flexible</option>
                </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <th className="px-4 py-3">Job</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Urgency</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Suburb</th>
                            <th className="px-4 py-3">Member</th>
                            <th className="px-4 py-3">Tradie</th>
                            <th className="px-4 py-3">Submitted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jobs.data.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <Link href={`/admin/jobs/${job.public_id}`} className="font-medium text-indigo-600 hover:underline">
                                        {job.public_id}
                                    </Link>
                                    {job.requires_admin_review && (
                                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">Review</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {job.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{job.urgency.replace(/_/g, ' ')}</td>
                                <td className="px-4 py-3 text-gray-600">{job.category?.name ?? '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{job.property?.suburb?.name ?? '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{job.member.first_name} {job.member.last_name}</td>
                                <td className="px-4 py-3 text-gray-600">{job.assigned_company?.business_name ?? '—'}</td>
                                <td className="px-4 py-3 text-gray-400">{new Date(job.submitted_at).toLocaleDateString('en-AU')}</td>
                            </tr>
                        ))}
                        {jobs.data.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No jobs found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {jobs.links && (
                <div className="flex gap-1 justify-center flex-wrap">
                    {jobs.links.map((link, i) => (
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

JobsIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
