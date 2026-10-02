import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Suburb {
    id: number;
    name: string;
    postcode: string;
    state: string;
    is_active: boolean;
}

interface Paginator {
    data: Suburb[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    suburbs: Paginator;
    filters: { q?: string; active?: string };
}

export default function SuburbsIndex({ suburbs, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/admin/suburbs', { q: search || undefined }, { preserveState: true, replace: true });
    }

    function setActive(val: string) {
        router.get('/admin/suburbs', { q: filters.q || undefined, active: val || undefined }, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Locations <span className="ml-2 text-sm font-normal text-gray-500">({suburbs.total} total)</span></h1>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={applySearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or postcode…"
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
                        />
                        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                            Search
                        </button>
                    </form>
                    <select
                        value={filters.active ?? ''}
                        onChange={e => setActive(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="">All</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Postal code</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">County</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {suburbs.data.length === 0 && (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No locations found.</td></tr>
                            )}
                            {suburbs.data.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.postcode}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.state}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {suburbs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Showing {suburbs.from}–{suburbs.to} of {suburbs.total}</span>
                        <div className="flex gap-1">
                            {suburbs.links.map((link, i) => (
                                link.url ? (
                                    <button
                                        key={i}
                                        onClick={() => router.get(link.url!)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded px-3 py-1 ${link.active ? 'bg-brand-500 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                                    />
                                ) : (
                                    <span key={i} dangerouslySetInnerHTML={{ __html: link.label }} className="rounded px-3 py-1 text-gray-300" />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
