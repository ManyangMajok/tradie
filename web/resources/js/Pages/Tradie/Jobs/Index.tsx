import React from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Briefcase, ChevronRight } from 'lucide-react';

interface Suburb { name: string; }
interface Property { address_line_1: string; suburb: Suburb; }
interface Category { name: string; }

interface Job {
    id: number;
    public_id: string;
    status: string;
    assigned_at: string;
    category: Category;
    property: Property;
}

interface PaginatedJobs {
    data: Job[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props { jobs: PaginatedJobs; }

const ACTIVE_STATUSES = new Set(['assigned', 'tradie_on_the_way', 'in_progress', 'awaiting_client_response', 'rescheduled']);

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
    assigned:                  { label: 'Assigned',       colour: 'text-blue-600' },
    tradie_on_the_way:         { label: 'On the way',     colour: 'text-blue-600' },
    in_progress:               { label: 'In progress',    colour: 'text-green-600' },
    awaiting_client_response:  { label: 'Awaiting client', colour: 'text-amber-500' },
    rescheduled:               { label: 'Rescheduled',    colour: 'text-amber-500' },
    completed:                 { label: 'Awaiting review', colour: 'text-amber-500' },
    confirmed:                 { label: 'Confirmed',      colour: 'text-gray-400' },
    disputed:                  { label: 'Disputed',       colour: 'text-red-500' },
};

export default function TradieJobsIndex({ jobs }: Props) {
    const activeJobs = jobs.data.filter((j) => ACTIVE_STATUSES.has(j.status));
    const recentJobs = jobs.data.filter((j) => !ACTIVE_STATUSES.has(j.status));

    function JobCard({ job }: { job: Job }) {
        const cfg = STATUS_LABELS[job.status] ?? { label: job.status, colour: 'text-gray-500' };
        return (
            <Link href={`/tradie/jobs/${job.public_id}`}>
                <Card className="transition-shadow hover:shadow-md">
                    <CardBody className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <span className="font-semibold text-gray-900">{job.category.name}</span>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {job.property.address_line_1}, {job.property.suburb.name}
                            </p>
                            <p className={`mt-0.5 text-sm font-medium ${cfg.colour}`}>{cfg.label}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-gray-400">
                                {new Date(job.assigned_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                    </CardBody>
                </Card>
            </Link>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                <p className="mt-1 text-sm text-gray-500">{jobs.total} job{jobs.total !== 1 ? 's' : ''} total</p>
            </div>

            {activeJobs.length === 0 && recentJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                    <Briefcase className="h-12 w-12" />
                    <p className="text-sm">No jobs yet — accept a lead to get started.</p>
                </div>
            ) : (
                <>
                    {activeJobs.length > 0 && (
                        <div>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Active</h2>
                            <div className="space-y-3">
                                {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
                            </div>
                        </div>
                    )}

                    {recentJobs.length > 0 && (
                        <div>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent</h2>
                            <div className="space-y-3">
                                {recentJobs.map((job) => <JobCard key={job.id} job={job} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

TradieJobsIndex.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
