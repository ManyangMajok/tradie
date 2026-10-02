import React from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface IssueType {
    id: number;
    slug: string;
    name: string;
    category: string;
    sort_order: number;
    is_active: boolean;
}

interface Category {
    id: number;
    name: string;
}

interface Props {
    issueTypes: IssueType[];
    categories: Category[];
    filters: { category_id?: string };
}

export default function IssueTypesIndex({ issueTypes, categories, filters }: Props) {
    function setCategory(val: string) {
        router.get('/admin/issue-types', { category_id: val || undefined }, { preserveState: true, replace: true });
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Issue Types <span className="ml-2 text-sm font-normal text-gray-500">({issueTypes.length} shown)</span>
                    </h1>
                    <p className="text-sm text-gray-400">Edit via seeder — UI management in Phase 2</p>
                </div>

                <div>
                    <select
                        value={filters.category_id ?? ''}
                        onChange={e => setCategory(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="">All categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {issueTypes.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No issue types found.</td></tr>
                            )}
                            {issueTypes.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{t.category}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.slug}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.sort_order}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
