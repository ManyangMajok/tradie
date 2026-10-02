import React from 'react';
import MemberLayout from '../../../Layouts/MemberLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Inbox, ChevronRight } from 'lucide-react';

interface Suburb { name: string; postcode: string; }
interface Property { address_line_1: string; suburb: Suburb; }
interface Category { name: string; }
interface Company { business_name: string; }

interface Job {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    submitted_at: string;
    property: Property;
    category: Category;
    assigned_company: Company | null;
}

interface PaginatedJobs {
    data: Job[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props { jobs: PaginatedJobs; }

const STATUS_LABELS: Record<string, { label: string; colour: string }> = {
    pending_dispatch: { label: 'Finding a tradie…', colour: 'text-blue-500' },
    offered:          { label: 'Finding a tradie…', colour: 'text-blue-500' },
    assigned:         { label: 'Tradie assigned',   colour: 'text-green-600' },
    tradie_on_the_way:{ label: 'On the way',         colour: 'text-green-600' },
    in_progress:      { label: 'In progress',        colour: 'text-green-600' },
    completed:        { label: 'Awaiting review',    colour: 'text-amber-500' },
    confirmed:        { label: 'Confirmed',           colour: 'text-gray-500' },
    disputed:         { label: 'Disputed',            colour: 'text-red-500' },
    cancelled:        { label: 'Cancelled',           colour: 'text-gray-400' },
};

export default function JobsIndex({ jobs }: Props) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                    <p className="mt-1 text-sm text-gray-500">{jobs.total} job{jobs.total !== 1 ? 's' : ''} total</p>
                </div>
                <Link
                    href="/jobs/new"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Request a tradie
                </Link>
            </div>

            {jobs.data.length === 0 ? (
                <div className="mt-16 flex flex-col items-center gap-3 text-gray-400">
                    <Inbox className="h-12 w-12" />
                    <p className="text-sm">No jobs yet</p>
                    <Link href="/jobs/new" className="text-sm text-blue-600 hover:underline">
                        Request your first tradie
                    </Link>
                </div>
            ) : (
                <div className="mt-6 space-y-3">
                    {jobs.data.map((job) => {
                        const cfg = STATUS_LABELS[job.status] ?? { label: job.status, colour: 'text-gray-500' };
                        return (
                            <Link key={job.id} href={`/jobs/${job.public_id}`}>
                                <Card className="transition-shadow hover:shadow-md">
                                    <CardBody className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-gray-900">{job.category.name}</span>
                                                <span className="text-sm text-gray-500">
                                                    — {job.property.address_line_1}, {job.property.suburb.name}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-3">
                                                <span className={`text-sm font-medium ${cfg.colour}`}>{cfg.label}</span>
                                                {job.assigned_company && (
                                                    <span className="text-sm text-gray-400">{job.assigned_company.business_name}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                                {new Date(job.submitted_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-gray-300" />
                                        </div>
                                    </CardBody>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

JobsIndex.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
