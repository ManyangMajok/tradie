import React from 'react';
import MemberLayout from '../../Layouts/MemberLayout';
import { Link } from '@inertiajs/react';
import { useAuth } from '../../Hooks/useAuth';
import { Card, CardBody } from '../../Components/ui/Card';
import { PlusCircle, Wrench } from 'lucide-react';

export default function Dashboard({recentJobs,propertyCount}:{recentJobs:{id:number;public_id:string;status:string;custom_issue:string|null;category:{name:string}}[];propertyCount:number}) {
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.first_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
                What do you need help with today?
            </p>

            {propertyCount === 0 && <p className="mt-4 rounded-lg bg-brand-50 p-4 text-brand-800"><Link href="/properties/create" className="font-medium underline">Add your first property</Link> to find fundis serving your location.</p>}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardBody>
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-brand-50 p-3">
                                <PlusCircle className="h-6 w-6 text-brand-500" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900">Book a tradie</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    No call-out fee. A tradie accepts or you pay nothing.
                                </p>
                                <Link
                                    href="/jobs/new"
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                                >
                                    Get a tradie
                                </Link>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-gray-100 p-3">
                                <Wrench className="h-6 w-6 text-gray-500" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900">Your jobs</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Track the status of open and past jobs.
                                </p>
                                <Link
                                    href="/jobs"
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                    View jobs
                                </Link>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5"><h2 className="text-lg font-semibold">Recent jobs</h2>{recentJobs.length ? <ul className="mt-3 divide-y divide-gray-100">{recentJobs.map(job=><li key={job.id} className="py-3"><Link href={`/jobs/${job.public_id}`} className="font-medium text-brand-700 underline">{job.custom_issue || job.category.name}</Link><span className="ml-3 text-sm text-gray-600">{job.status.replace(/_/g,' ')}</span></li>)}</ul> : <p className="mt-2 text-gray-600">No jobs yet.</p>}</section>
        </div>
    );
}

Dashboard.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
