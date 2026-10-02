import React from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Tradie {
    id: number;
    business_name: string;
    status: string;
    rating_average: number | null;
    rating_count: number;
    abn: string;
    created_at: string;
    owner: { first_name: string; last_name: string; email: string };
    active_subscription: { status: string } | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Filters {
    status?: string;
    sort?: string;
}

interface Props {
    tradies: Paginated<Tradie>;
    filters: Filters;
}

const STATUS_COLOURS: Record<string, string> = {
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    rejected: 'bg-gray-200 text-gray-500',
};

export default function TradiesIndex({ tradies, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get('/admin/tradies', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Tradies</h1>
                <span className="text-sm text-gray-500">{tradies.meta?.total ?? tradies.data.length} total</span>
            </div>

            <div className="flex flex-wrap gap-3">
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => applyFilter('status', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All statuses</option>
                    <option value="pending_review">Pending review</option>
                    <option value="approved">Approved</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select
                    value={filters.sort ?? ''}
                    onChange={(e) => applyFilter('sort', e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Sort: newest</option>
                    <option value="rating">Sort: rating</option>
                    <option value="leads">Sort: leads</option>
                </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                            <th className="px-4 py-3">Business</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Subscription</th>
                            <th className="px-4 py-3">Rating</th>
                            <th className="px-4 py-3">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tradies.data.map((tradie) => (
                            <tr key={tradie.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <Link href={`/admin/tradies/${tradie.id}`} className="font-medium text-indigo-600 hover:underline">
                                        {tradie.business_name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {tradie.owner.first_name} {tradie.owner.last_name}
                                    <div className="text-xs text-gray-400">{tradie.owner.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[tradie.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                        {tradie.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {tradie.active_subscription
                                        ? <span className="text-green-600 font-medium">Active</span>
                                        : <span className="text-gray-400">None</span>
                                    }
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {tradie.rating_average != null
                                        ? <span>★ {tradie.rating_average.toFixed(1)} <span className="text-gray-400">({tradie.rating_count})</span></span>
                                        : <span className="text-gray-400">—</span>
                                    }
                                </td>
                                <td className="px-4 py-3 text-gray-400">{new Date(tradie.created_at).toLocaleDateString('en-AU')}</td>
                            </tr>
                        ))}
                        {tradies.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tradies found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {tradies.links && (
                <div className="flex gap-1 justify-center flex-wrap">
                    {tradies.links.map((link, i) => (
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

TradiesIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
