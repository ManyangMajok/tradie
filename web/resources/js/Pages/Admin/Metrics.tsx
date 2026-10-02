import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Card, CardBody } from '../../Components/ui/Card';

interface Metrics {
    total_jobs: number;
    jobs_this_month: number;
    jobs_by_status: Record<string, number>;
    confirmed_jobs: number;
    disputed_jobs: number;
    avg_stars: number;
    active_member_subs: number;
    active_tradie_subs: number;
    pending_applications: number;
    avg_tradie_rating: number;
}

interface Props {
    metrics: Metrics;
}

export default function Metrics({ metrics }: Props) {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Platform metrics</h1>
            <p className="text-sm text-gray-500">Cached for 10 minutes.</p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardBody><p className="text-sm text-gray-500">Total jobs</p><p className="text-3xl font-bold text-gray-900">{metrics.total_jobs}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Jobs this month</p><p className="text-3xl font-bold text-gray-900">{metrics.jobs_this_month}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Active member subs</p><p className="text-3xl font-bold text-gray-900">{metrics.active_member_subs}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Active tradie subs</p><p className="text-3xl font-bold text-gray-900">{metrics.active_tradie_subs}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Confirmed jobs</p><p className="text-3xl font-bold text-green-600">{metrics.confirmed_jobs}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Disputed jobs</p><p className="text-3xl font-bold text-red-600">{metrics.disputed_jobs}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Avg review stars</p><p className="text-3xl font-bold text-yellow-500">{metrics.avg_stars > 0 ? `★ ${metrics.avg_stars}` : '—'}</p></CardBody></Card>
                <Card><CardBody><p className="text-sm text-gray-500">Avg tradie rating</p><p className="text-3xl font-bold text-yellow-500">{metrics.avg_tradie_rating > 0 ? `★ ${metrics.avg_tradie_rating}` : '—'}</p></CardBody></Card>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Jobs by status</h2>
                <dl className="space-y-2">
                    {Object.entries(metrics.jobs_by_status).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-3">
                            <dt className="w-48 text-sm text-gray-500">{status.replace(/_/g, ' ')}</dt>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${metrics.total_jobs > 0 ? (count / metrics.total_jobs) * 100 : 0}%` }}
                                />
                            </div>
                            <dd className="w-10 text-right text-sm font-medium text-gray-900">{count}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}

Metrics.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
