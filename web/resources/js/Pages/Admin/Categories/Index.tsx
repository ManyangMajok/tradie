import React from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';

interface Category {
    id: number;
    slug: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    issue_type_count: number;
}

interface Props {
    categories: Category[];
}

export default function CategoriesIndex({ categories }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Tradie Categories <span className="ml-2 text-sm font-normal text-gray-500">({categories.length} total)</span>
                    </h1>
                    <p className="text-sm text-gray-400">Edit via seeder — UI management in Phase 2</p>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Issue types</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No categories seeded yet.</td></tr>
                            )}
                            {categories.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-500">{c.sort_order}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.issue_type_count}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {c.is_active ? 'Active' : 'Inactive'}
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
