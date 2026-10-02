import React, { useEffect, useState } from 'react';
import TradieLayout from '../../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Button } from '../../../Components/ui/Button';
import { Clock, MapPin, Wrench, AlertCircle } from 'lucide-react';

interface Suburb { name: string; state: string; postcode: string; }
interface Property { property_type: string; suburb: Suburb; }
interface Category { name: string; }
interface IssueType { name: string; }
interface Job {
    id: number;
    urgency: string;
    description: string;
    property: Property;
    category: Category;
    issue_type: IssueType | null;
    custom_issue: string | null;
}
interface Offer {
    id: number;
    status: string;
    expires_at: string;
    round: number;
    rank_in_round: number;
    job: Job;
}
interface Props { offer: Offer; }

const DECLINE_REASONS = [
    { value: 'too_far', label: 'Too far away' },
    { value: 'busy', label: 'Already booked' },
    { value: 'not_my_work', label: "Not my area of work" },
    { value: 'other', label: 'Other' },
];

function countdown(expiresAt: string): string {
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LeadShow({ offer }: Props) {
    const [, rerender] = React.useReducer((n: number) => n + 1, 0);
    const [showDecline, setShowDecline] = useState(false);
    const [declineReason, setDeclineReason] = useState('too_far');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const id = setInterval(rerender, 1000);
        return () => clearInterval(id);
    }, []);

    const expired = new Date(offer.expires_at).getTime() <= Date.now();
    const isActive = offer.status === 'offered' || offer.status === 'viewed';
    const isUrgent = offer.job.urgency === 'emergency';
    const urgencyLabel = offer.job.urgency.replace(/_/g, ' ');

    function accept() {
        setProcessing(true);
        router.post(`/tradie/leads/${offer.id}/accept`, {}, {
            onSuccess: (page) => {
                const publicId = (page.props as Record<string, unknown>).public_id as string | undefined;
                if (publicId) {
                    router.visit(`/tradie/jobs/${publicId}`);
                } else {
                    router.visit('/tradie');
                }
            },
            onError: (errs) => {
                const msg = Object.values(errs)[0] as string;
                alert(msg ?? 'Something went wrong.');
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    function decline() {
        setProcessing(true);
        router.post(`/tradie/leads/${offer.id}/decline`, { reason: declineReason }, {
            onSuccess: () => router.visit('/tradie'),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="mx-auto max-w-lg space-y-4">
            {/* Timer */}
            {isActive && !expired && (
                <div className={`flex items-center justify-center gap-2 rounded-xl p-4 text-center ${
                    isUrgent ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                    <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                        {countdown(offer.expires_at)}
                    </span>
                    <span className="text-sm text-gray-500">remaining</span>
                </div>
            )}

            {/* Expired / unavailable state */}
            {(expired || !isActive) && (
                <Card>
                    <CardBody className="flex items-center gap-3 py-6 text-center">
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                        <p className="text-sm text-gray-500">This offer is no longer available.</p>
                    </CardBody>
                </Card>
            )}

            {/* Job details */}
            <Card>
                <CardBody className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                {isUrgent && (
                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold uppercase text-red-600">
                                        Emergency
                                    </span>
                                )}
                                <h1 className="text-xl font-bold text-gray-900">{offer.job.category.name}</h1>
                            </div>
                            <p className="mt-0.5 text-sm capitalize text-gray-500">{urgencyLabel}</p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>
                                {offer.job.property.suburb.name}, {offer.job.property.suburb.state} {offer.job.property.suburb.postcode}
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                            <span>{offer.job.issue_type?.name ?? offer.job.custom_issue ?? 'General enquiry'}</span>
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        {offer.job.description}
                    </div>

                    <p className="text-xs text-gray-400">
                        Property type: <span className="capitalize">{offer.job.property.property_type}</span>
                    </p>
                </CardBody>
            </Card>

            {/* Actions */}
            {isActive && !expired && !showDecline && (
                <div className="flex flex-col gap-3">
                    <Button className="w-full" onClick={accept} loading={processing}>
                        Accept this lead
                    </Button>
                    <button
                        type="button"
                        onClick={() => setShowDecline(true)}
                        className="w-full rounded-lg border border-gray-200 py-2.5 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                    >
                        Decline
                    </button>
                </div>
            )}

            {/* Decline reason */}
            {showDecline && (
                <Card>
                    <CardBody className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">Why are you declining?</h3>
                        <div className="space-y-2">
                            {DECLINE_REASONS.map((r) => (
                                <label key={r.value} className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={r.value}
                                        checked={declineReason === r.value}
                                        onChange={() => setDeclineReason(r.value)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">{r.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={decline}
                                loading={processing}
                            >
                                Confirm decline
                            </Button>
                            <button
                                type="button"
                                onClick={() => setShowDecline(false)}
                                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:border-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}

LeadShow.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
