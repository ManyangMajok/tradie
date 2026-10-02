import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Card, CardBody } from '../../Components/ui/Card';
import { Users, Briefcase, UserCheck, ShieldAlert, Clock, AlertCircle } from 'lucide-react';

interface Counts {
    active_members: number;
    active_tradies: number;
    jobs_this_month: number;
    jobs_requiring_review: number;
}

interface Attention {
    pending_tradie_applications: number;
    disputed_jobs: number;
    unassigned_jobs: number;
    renewals_in_7_days: number;
}

interface LiveJob {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    category: string | null;
    suburb: string | null;
    member_name: string;
    tradie_name: string | null;
    submitted_at: string;
}

interface Props {
    counts: Counts;
    attention: Attention;
    liveJobs: LiveJob[];
}

const STATUS_COLOURS: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-700',
    tradie_on_the_way: 'bg-indigo-100 text-indigo-700',
    in_progress: 'bg-purple-100 text-purple-700',
    rescheduled: 'bg-yellow-100 text-yellow-700',
};

export default function Overview({ counts, attention, liveJobs }: Props) {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg p-3 bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm text-gray-500">Active members</p>
                                <p className="text-2xl font-bold text-gray-900">{counts.active_members}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg p-3 bg-green-50 text-green-600"><UserCheck className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm text-gray-500">Active tradies</p>
                                <p className="text-2xl font-bold text-gray-900">{counts.active_tradies}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg p-3 bg-purple-50 text-purple-600"><Briefcase className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm text-gray-500">Jobs this month</p>
                                <p className="text-2xl font-bold text-gray-900">{counts.jobs_this_month}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="rounded-lg p-3 bg-red-50 text-red-600"><ShieldAlert className="h-5 w-5" /></div>
                            <div>
                                <p className="text-sm text-gray-500">Requiring review</p>
                                <p className="text-2xl font-bold text-gray-900">{counts.jobs_requiring_review}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {attention.pending_tradie_applications > 0 && (
                    <Link href="/admin/applications" className="block">
                        <Card>
                            <CardBody className="flex items-center gap-3 text-yellow-700 bg-yellow-50">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span className="text-sm font-medium">{attention.pending_tradie_applications} pending application{attention.pending_tradie_applications !== 1 ? 's' : ''}</span>
                            </CardBody>
                        </Card>
                    </Link>
                )}
                {attention.disputed_jobs > 0 && (
                    <Link href="/admin/disputes" className="block">
                        <Card>
                            <CardBody className="flex items-center gap-3 text-red-700 bg-red-50">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <span className="text-sm font-medium">{attention.disputed_jobs} open dispute{attention.disputed_jobs !== 1 ? 's' : ''}</span>
                            </CardBody>
                        </Card>
                    </Link>
                )}
                {attention.unassigned_jobs > 0 && (
                    <Link href="/admin/jobs?status=pending_dispatch" className="block">
                        <Card>
                            <CardBody className="flex items-center gap-3 text-orange-700 bg-orange-50">
                                <Clock className="h-5 w-5 shrink-0" />
                                <span className="text-sm font-medium">{attention.unassigned_jobs} unassigned job{attention.unassigned_jobs !== 1 ? 's' : ''}</span>
                            </CardBody>
                        </Card>
                    </Link>
                )}
                {attention.renewals_in_7_days > 0 && (
                    <Card>
                        <CardBody className="flex items-center gap-3 text-blue-700 bg-blue-50">
                            <Clock className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-medium">{attention.renewals_in_7_days} renewal{attention.renewals_in_7_days !== 1 ? 's' : ''} in 7 days</span>
                        </CardBody>
                    </Card>
                )}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live jobs</h2>
                {liveJobs.length === 0 ? (
                    <p className="text-sm text-gray-500">No active jobs right now.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Job</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Suburb</th>
                                    <th className="px-4 py-3">Member</th>
                                    <th className="px-4 py-3">Tradie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {liveJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/jobs/${job.public_id}`} className="font-medium text-indigo-600 hover:underline">
                                                {job.public_id}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOURS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {job.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{job.category ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{job.suburb ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700">{job.member_name}</td>
                                        <td className="px-4 py-3 text-gray-700">{job.tradie_name ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

Overview.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
