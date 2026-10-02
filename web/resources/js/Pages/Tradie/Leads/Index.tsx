import React from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { Link } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Inbox, Clock } from 'lucide-react';

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
            <h1 className="text-2xl font-bold text-gray-900">Available Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
                {leads.length > 0
                    ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} waiting`
                    : 'No leads right now — check back shortly.'}
            </p>

            {leads.length === 0 ? (
                <div className="mt-12 flex flex-col items-center gap-3 text-gray-400">
                    <Inbox className="h-12 w-12" />
                    <p className="text-sm">Your inbox is empty</p>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {leads.map((lead) => {
                        const urgency = lead.job.urgency.replace(/_/g, ' ');
                        const isUrgent = lead.job.urgency === 'emergency';

                        return (
                            <Link key={lead.id} href={`/tradie/leads/${lead.id}`}>
                                <Card className={`transition-shadow hover:shadow-md ${isUrgent ? 'border-red-200' : ''}`}>
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
                                            <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
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
