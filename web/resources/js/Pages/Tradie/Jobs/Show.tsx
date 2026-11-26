import React, { useState } from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Button } from '../../../Components/ui/Button';
import { CheckCircle2, XCircle, Clock, MapPin, Phone, User } from 'lucide-react';

interface Suburb { name: string; postcode: string; }
interface Property { address_line_1: string; suburb: Suburb; }
interface Category { name: string; }
interface Member { first_name: string; last_name: string; phone: string | null; }
interface StatusLog { id: number; to_status: string; note: string | null; created_at: string; }

interface Job {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    description: string;
    assigned_at: string;
    on_the_way_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    category: Category;
    property: Property;
    member: Member;
    status_logs: StatusLog[];
}

interface Props { job: Job; }

const STATUS_LABELS: Record<string, string> = {
    assigned:                 'Assigned',
    tradie_on_the_way:        'On the way',
    in_progress:              'In progress',
    awaiting_client_response: 'Awaiting client',
    rescheduled:              'Rescheduled',
    completed:                'Completed',
    confirmed:                'Confirmed',
    disputed:                 'Disputed',
};

export default function TradieJobShow({ job }: Props) {
    const [processing, setProcessing] = useState(false);

    function updateStatus(toStatus: string) {
        setProcessing(true);
        router.post(`/tradie/jobs/${job.public_id}/status`, { to_status: toStatus }, {
            onError: (errs) => alert(Object.values(errs)[0] ?? 'Something went wrong.'),
            onFinish: () => setProcessing(false),
        });
    }

    const canMarkOnTheWay   = job.status === 'assigned';
    const canMarkInProgress = job.status === 'assigned' || job.status === 'tradie_on_the_way';
    const canComplete       = job.status === 'in_progress' || job.status === 'awaiting_client_response';
    const isFinished        = ['completed', 'confirmed', 'disputed'].includes(job.status);

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-gray-400">{job.public_id}</p>
                    <h1 className="text-2xl font-bold text-gray-900">{job.category.name}</h1>
                    <p className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.property.address_line_1}, {job.property.suburb.name} {job.property.suburb.postcode}
                    </p>
                </div>
                <span className="text-sm font-medium text-gray-600">
                    {STATUS_LABELS[job.status] ?? job.status}
                </span>
            </div>

            {/* Member contact */}
            <Card>
                <CardBody className="space-y-2">
                    <h2 className="text-sm font-semibold text-gray-700">Member contact</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4 text-gray-400" />
                        {job.member.first_name} {job.member.last_name}
                    </div>
                    {job.member.phone && (
                        <a href={`tel:${job.member.phone}`} className="flex items-center gap-2 text-sm text-brand-500 hover:underline">
                            <Phone className="h-4 w-4" />
                            {job.member.phone}
                        </a>
                    )}
                </CardBody>
            </Card>

            {/* Job details */}
            <Card>
                <CardBody className="space-y-3 text-sm">
                    <h2 className="font-semibold text-gray-700">Job details</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
                        <span className="text-gray-400">Urgency</span>
                        <span className="capitalize">{job.urgency.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400">Assigned</span>
                        <span>{new Date(job.assigned_at).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}</span>
                    </div>
                    <p className="border-t border-gray-100 pt-3 text-gray-700">{job.description}</p>
                </CardBody>
            </Card>

            {/* Action buttons */}
            {!isFinished && (
                <Card>
                    <CardBody className="space-y-3">
                        <h2 className="text-sm font-semibold text-gray-700">Update status</h2>

                        {canMarkOnTheWay && (
                            <Button
                                className="w-full"
                                onClick={() => updateStatus('tradie_on_the_way')}
                                loading={processing}
                            >
                                I'm on my way
                            </Button>
                        )}

                        {canMarkInProgress && (
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => updateStatus('in_progress')}
                                loading={processing}
                            >
                                I've started the job
                            </Button>
                        )}

                        {canComplete && (
                            <Button
                                className="w-full"
                                onClick={() => router.visit(`/tradie/jobs/${job.public_id}/complete`)}
                            >
                                Mark job complete
                            </Button>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Completed state */}
            {isFinished && (
                <Card>
                    <CardBody className="flex items-center gap-3">
                        {job.status === 'confirmed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : job.status === 'disputed' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                        )}
                        <p className="text-sm text-gray-700">
                            {job.status === 'completed' && 'Job marked complete — waiting for member review.'}
                            {job.status === 'confirmed' && 'Job confirmed. Well done!'}
                            {job.status === 'disputed' && 'This job has been disputed. Our team will be in touch.'}
                        </p>
                    </CardBody>
                </Card>
            )}

            {/* Status timeline */}
            {job.status_logs.length > 0 && (
                <Card>
                    <CardBody>
                        <h2 className="mb-3 text-sm font-semibold text-gray-700">Activity</h2>
                        <ol className="space-y-3">
                            {job.status_logs.map((log) => (
                                <li key={log.id} className="flex gap-3 text-sm">
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                                    <div>
                                        <span className="font-medium capitalize text-gray-700">
                                            {log.to_status.replace(/_/g, ' ')}
                                        </span>
                                        {log.note && <span className="text-gray-400"> — {log.note}</span>}
                                        <p className="text-xs text-gray-400">
                                            {new Date(log.created_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

TradieJobShow.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
