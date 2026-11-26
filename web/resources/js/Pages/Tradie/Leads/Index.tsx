import { ActionIcon } from '../../../Components/ui/ActionIcon';
import React from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Inbox, Clock, ArrowUpRight, MapPin, Calendar } from 'lucide-react';

interface Suburb { name: string; }
interface Property { suburb: Suburb; }
interface Category { name: string; }
interface IssueType { name: string; }
interface Job {
    urgency: string;
    description: string;
    property: Property;
    category: Category;
    issue_type: IssueType | null;
    custom_issue: string | null;
}
interface Lead {
    id: number;
    offered_at: string;
    expires_at: string;
    job: Job;
}
interface Props { leads: Lead[]; }

function countdown(expiresAt: string): string {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LeadsIndex({ leads }: Props) {
    const [, rerender] = React.useReducer((n: number) => n + 1, 0);

    React.useEffect(() => {
        const id = setInterval(rerender, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div>
            <Head title="Your leads" />
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-sm text-gray-500">Good work starts with a connection</p><h1 className="text-balance text-3xl font-semibold sm:text-4xl">Your next opportunity.</h1><p className="mt-3 text-pretty text-gray-500">Manage incoming requests and keep your working day on track.</p></div><Link href="/tradie/jobs" className="action-dark">View my jobs <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <section className="rounded-3xl bg-accent-500 p-6 text-gray-950"><div className="flex items-center justify-between"><h2 className="text-sm font-medium">Available leads</h2><Inbox className="size-5" aria-hidden="true" /></div><p className="mt-6 text-5xl font-medium tabular-nums">{leads.length}</p><p className="mt-4 text-sm">Requests waiting for your response.</p></section>
                <section className="rounded-3xl bg-white p-6"><MapPin className="size-5 text-gray-500" aria-hidden="true" /><h2 className="mt-5 text-lg font-semibold">Be found nearby</h2><p className="mt-2 text-pretty text-sm leading-6 text-gray-500">Keep your trades and service areas current to receive relevant requests.</p><div className="mt-4 flex flex-wrap gap-4"><Link href="/tradie/categories" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"><ActionIcon name="trade" inline />Your trades</Link><Link href="/tradie/service-areas" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"><ActionIcon name="location" inline />Service areas</Link></div></section>
                <section className="rounded-3xl bg-white p-6"><Calendar className="size-5 text-gray-500" aria-hidden="true" /><h2 className="mt-5 text-lg font-semibold">Ready for work?</h2><p className="mt-2 text-pretty text-sm leading-6 text-gray-500">Set your opening hours and activate your demo subscription to receive leads.</p><div className="mt-4 flex flex-wrap gap-4"><Link href="/tradie/availability" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"><ActionIcon name="calendar" inline />Availability</Link><Link href="/tradie/subscription" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline"><ActionIcon name="billing" inline />Subscription</Link></div></section>
            </div>
            <h2 className="mb-4 text-balance text-lg font-semibold">Lead inbox</h2>
            {leads.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-12 text-gray-500">
                    <Inbox className="size-10" aria-hidden="true" />
                    <h3 className="font-medium text-gray-900">You’re all caught up</h3><p className="text-center text-sm">New requests from local clients will appear here.</p><Link href="/tradie/availability" className="action-light mt-2"><ActionIcon name="calendar" inline />Review availability</Link>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {leads.map((lead) => {
                        const urgency = lead.job.urgency.replace(/_/g, ' ');
                        const isUrgent = lead.job.urgency === 'emergency';

                        return (
                            <Link className="block rounded-3xl" key={lead.id} href={`/tradie/leads/${lead.id}`}>
                                <Card className={`hover:shadow-sm ${isUrgent ? 'border-red-200' : ''}`}>
                                    <CardBody className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {isUrgent && (
                                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold uppercase text-red-600">
                                                        Emergency
                                                    </span>
                                                )}
                                                <span className="font-semibold text-gray-900">
                                                    {lead.job.category.name}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    in {lead.job.property.suburb.name}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {lead.job.issue_type?.name ?? lead.job.custom_issue ?? 'General enquiry'}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                                {lead.job.description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className="flex items-center gap-1 text-sm font-medium tabular-nums text-amber-800">
                                                <Clock className="h-3.5 w-3.5" />
                                                {countdown(lead.expires_at)}
                                            </div>
                                            <p className="mt-1 text-xs capitalize text-gray-400">{urgency}</p>
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

LeadsIndex.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
