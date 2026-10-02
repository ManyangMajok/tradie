import React from 'react';
import TradieLayout from '../../Layouts/TradieLayout';
import { Star } from 'lucide-react';

interface Stats {
    leads_offered: number;
    leads_accepted: number;
    leads_declined: number;
    leads_expired: number;
    jobs_completed: number;
    jobs_disputed: number;
    reported_revenue_cents: number;
    acceptance_rate: number | null;
    avg_response_minutes: number | null;
}

interface DailyRow {
    date: string;
    leads_offered: number;
    leads_accepted: number;
    jobs_completed: number;
}

interface Props {
    stats: Stats;
    rating: { average: number | null; count: number };
    daily: DailyRow[];
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

export default function Performance({ stats, rating, daily }: Props) {
    const revenue = (stats.reported_revenue_cents / 100).toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
    });

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
            <p className="mt-1 text-sm text-gray-500">Last 30 days</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatTile label="Leads offered" value={String(stats.leads_offered)} />
                <StatTile
                    label="Acceptance rate"
                    value={stats.acceptance_rate !== null ? `${stats.acceptance_rate}%` : '—'}
                    sub={`${stats.leads_accepted} accepted · ${stats.leads_declined} declined · ${stats.leads_expired} expired`}
                />
                <StatTile
                    label="Avg response time"
                    value={stats.avg_response_minutes !== null ? `${stats.avg_response_minutes} min` : '—'}
                />
                <StatTile label="Jobs completed" value={String(stats.jobs_completed)} />
                <StatTile
                    label="Disputes"
                    value={String(stats.jobs_disputed)}
                    sub={stats.jobs_completed > 0 ? `${((stats.jobs_disputed / stats.jobs_completed) * 100).toFixed(1)}% of completed` : undefined}
                />
                <StatTile label="Reported revenue" value={revenue} sub="Self-reported at job completion" />
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">
                            {rating.average !== null ? rating.average.toFixed(1) : 'No rating yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {rating.count > 0 ? `${rating.count} review${rating.count !== 1 ? 's' : ''} (all time)` : 'No reviews yet'}
                        </p>
                    </div>
                </div>
            </div>

            {daily.length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-3 text-sm font-semibold text-gray-700">Daily activity</h2>
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Leads</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Accepted</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {daily.map(r => (
                                    <tr key={r.date} className="hover:bg-gray-50">
                                        <td className="px-4 py-2.5 text-gray-600">{r.date}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-900">{r.leads_offered}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-900">{r.leads_accepted}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-900">{r.jobs_completed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {daily.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                    <p className="text-sm text-gray-500">No activity in the last 30 days.</p>
                    <p className="mt-1 text-xs text-gray-400">Performance data appears here once you start accepting leads.</p>
                </div>
            )}
        </div>
    );
}

Performance.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
