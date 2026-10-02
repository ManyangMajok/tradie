import React, { useState } from 'react';
import MemberLayout from '../../../Layouts/MemberLayout';
import { router } from '@inertiajs/react';
import TradieChoices, { type AvailableTradie } from '../../../Components/TradieChoices';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Button } from '../../../Components/ui/Button';
import { Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Star } from 'lucide-react';

interface Suburb { name: string; postcode: string; }
interface Property { address_line_1: string; label: string; suburb: Suburb; }
interface Category { name: string; }
interface IssueType { name: string; }
interface StatusLog { id: number; from_status: string | null; to_status: string; note: string | null; created_at: string; }
interface Company { id: number; business_name: string; phone: string | null; }
interface Review {
    stars: number;
    work_completed_status: string;
    no_callout_fee_honoured: boolean;
    discount_honoured: string;
    review_text: string | null;
    was_auto_confirmed: boolean;
}

interface Job {
    id: number;
    public_id: string;
    status: string;
    urgency: string;
    description: string;
    submitted_at: string;
    property: Property;
    category: Category;
    issue_type: IssueType | null;
    custom_issue: string | null;
    assigned_company: Company | null;
    selected_tradie_company_id: number | null;
    selected_company: AvailableTradie | null;
    status_logs: StatusLog[];
    requires_admin_review: boolean;
    review: Review | null;
}

interface Props { job: Job; available_tradies: AvailableTradie[]; }

const STAR_VALUES = [1, 2, 3, 4, 5];

function ReviewForm({ job }: { job: Job }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form, setForm] = useState({
        work_completed_status: 'yes' as string,
        no_callout_fee_honoured: true as boolean,
        discount_honoured: 'yes' as string,
        stars: 5,
        review_text: '',
    });

    function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);
        router.post(`/jobs/${job.public_id}/review`, {
            ...form,
            review_text: form.review_text || null,
        }, {
            onError: (errs) => setErrors(errs as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Card>
            <CardBody className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Leave a review</h2>
                <p className="text-sm text-gray-500">
                    Let us know how {job.assigned_company?.business_name} did and confirm your member benefits were honoured.
                </p>

                <form onSubmit={submit} className="space-y-4">
                    {/* Work completed */}
                    <div>
                        <p className="text-sm font-medium text-gray-700">Was the work completed?</p>
                        <div className="mt-2 flex gap-4">
                            {[['yes', 'Yes'], ['partial', 'Partially'], ['no', 'No']].map(([val, label]) => (
                                <label key={val} className="flex cursor-pointer items-center gap-1.5">
                                    <input
                                        type="radio"
                                        name="work_completed"
                                        value={val}
                                        checked={form.work_completed_status === val}
                                        onChange={() => update('work_completed_status', val)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Call-out fee */}
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={form.no_callout_fee_honoured}
                            onChange={(e) => update('no_callout_fee_honoured', e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">Call-out fee was waived</span>
                    </label>

                    {/* Discount honoured */}
                    <div>
                        <p className="text-sm font-medium text-gray-700">Was your member discount applied?</p>
                        <div className="mt-2 flex gap-4">
                            {[['yes', 'Yes'], ['no', 'No'], ['na', 'Not applicable']].map(([val, label]) => (
                                <label key={val} className="flex cursor-pointer items-center gap-1.5">
                                    <input
                                        type="radio"
                                        name="discount"
                                        value={val}
                                        checked={form.discount_honoured === val}
                                        onChange={() => update('discount_honoured', val)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Star rating */}
                    <div>
                        <p className="text-sm font-medium text-gray-700">Overall rating</p>
                        <div className="mt-2 flex gap-1">
                            {STAR_VALUES.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => update('stars', n)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`h-7 w-7 transition-colors ${
                                            n <= form.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {errors.stars && <p className="mt-1 text-xs text-red-500">{errors.stars}</p>}
                    </div>

                    {/* Review text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Comments (optional)</label>
                        <textarea
                            className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                            rows={3}
                            placeholder="Anything else to add?"
                            maxLength={1000}
                            value={form.review_text}
                            onChange={(e) => update('review_text', e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full" loading={processing}>
                        Submit review
                    </Button>
                </form>
            </CardBody>
        </Card>
    );
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
    pending_dispatch: { label: 'Finding a tradie…', icon: Loader2, colour: 'text-blue-500' },
    offered:          { label: 'Finding a tradie…', icon: Loader2, colour: 'text-blue-500' },
    assigned:         { label: 'Tradie assigned',   icon: CheckCircle2, colour: 'text-green-600' },
    tradie_on_the_way:{ label: 'On the way',         icon: CheckCircle2, colour: 'text-green-600' },
    in_progress:      { label: 'In progress',        icon: CheckCircle2, colour: 'text-green-600' },
    completed:        { label: 'Awaiting your review', icon: AlertCircle, colour: 'text-amber-500' },
    confirmed:        { label: 'Confirmed',           icon: CheckCircle2, colour: 'text-green-700' },
    disputed:         { label: 'Disputed',            icon: XCircle, colour: 'text-red-500' },
    cancelled:        { label: 'Cancelled',           icon: XCircle, colour: 'text-gray-400' },
};

export default function JobShow({ job, available_tradies }: Props) {
    const [selectedTradie, setSelectedTradie] = useState<number | null>(null);
    const [choosing, setChoosing] = useState(false);
    const [choiceError, setChoiceError] = useState('');
    function chooseTradie(event: React.FormEvent) {
        event.preventDefault();
        if (!selectedTradie) { setChoiceError('Choose a tradie first.'); return; }
        setChoosing(true);
        router.post(`/jobs/${job.public_id}/choose-tradie`, { selected_tradie_company_id: selectedTradie }, {
            onError: (errors) => setChoiceError(errors.selected_tradie_company_id ?? 'Unable to send this request.'),
            onFinish: () => setChoosing(false),
        });
    }
    const memberChoice = job.selected_tradie_company_id !== null;

    const cfg = STATUS_CONFIG[job.status] ?? { label: job.status, icon: Clock, colour: 'text-gray-500' };
    const StatusIcon = cfg.icon;

    const isDispatching = ['pending_dispatch', 'offered'].includes(job.status);
    const isAssigned = ['assigned', 'tradie_on_the_way', 'in_progress'].includes(job.status);
    const isCancellable = ['pending_dispatch', 'offered', 'assigned', 'tradie_on_the_way', 'rescheduled'].includes(job.status);
    const awaitingReview = job.status === 'completed' && !job.review;

    function cancelJob() {
        if (!confirm('Cancel this job request?')) return;
        router.post(`/jobs/${job.public_id}/cancel`, { reason: 'Cancelled by member' });
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-400">{job.public_id}</p>
                    <h1 className="text-2xl font-bold text-gray-900">{job.category.name}</h1>
                    <p className="text-sm text-gray-500">{job.property.address_line_1}, {job.property.suburb.name}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-sm font-medium ${cfg.colour}`}>
                    <StatusIcon className={`h-4 w-4 ${isDispatching ? 'animate-spin' : ''}`} />
                    {memberChoice && job.status === 'offered' ? 'Waiting for your chosen tradie' : memberChoice && job.status === 'pending_dispatch' ? 'Choose another tradie' : cfg.label}
                </div>
            </div>

            {/* Dispatching state */}
            {isDispatching && !memberChoice && !job.requires_admin_review && (
                <Card>
                    <CardBody>
                        <p className="text-center text-sm text-gray-500 py-4">
                            We're finding you the best available tradie. You'll hear back shortly.
                        </p>
                    </CardBody>
                </Card>
            )}

            {/* Admin escalation */}
            {job.requires_admin_review && !memberChoice && (
                <Card>
                    <CardBody>
                        <p className="text-sm text-amber-700">
                            We had trouble finding a tradie automatically. Our team is sorting this now — you'll hear back shortly.
                        </p>
                    </CardBody>
                </Card>
            )}

            {memberChoice && job.status === 'offered' && (
                <Card><CardBody>
                    <h2 className="font-semibold text-gray-900">Request sent to {job.selected_company?.business_name ?? 'your chosen tradie'}</h2>
                    <p className="mt-2 text-sm text-gray-600">Waiting for them to accept. If they decline or do not respond in time, you can choose another available tradie here.</p>
                    <Button variant="secondary" className="mt-3" onClick={() => router.reload()}>Refresh status</Button>
                </CardBody></Card>
            )}
            {memberChoice && job.status === 'pending_dispatch' && (
                <Card><CardBody className="space-y-4">
                    <p className="text-sm text-gray-700">Your chosen tradie could not accept this request. Choose another below. Our team has also been notified.</p>
                    <form onSubmit={chooseTradie} className="space-y-4">
                        <TradieChoices tradies={available_tradies} selected={selectedTradie}
                            onChange={(id) => { setSelectedTradie(id); setChoiceError(''); }}
                            location={job.property.suburb.name} error={choiceError} disabled={choosing} />
                        <Button type="submit" loading={choosing} disabled={available_tradies.length === 0}>Send to chosen tradie</Button>
                        <Button type="button" variant="secondary" disabled={choosing} onClick={() => router.reload()}>Refresh availability</Button>
                    </form>
                </CardBody></Card>
            )}

            {/* Assigned tradie */}
            {isAssigned && job.assigned_company && (
                <Card>
                    <CardBody>
                        <h2 className="mb-2 text-sm font-semibold text-gray-700">Your tradie</h2>
                        <p className="text-lg font-semibold text-gray-900">{job.assigned_company.business_name}</p>
                        {job.assigned_company.phone && (
                            <a href={`tel:${job.assigned_company.phone}`} className="mt-1 text-sm text-blue-600 hover:underline">
                                {job.assigned_company.phone}
                            </a>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Job details */}
            <Card>
                <CardBody className="space-y-3 text-sm">
                    <h2 className="font-semibold text-gray-700">Job details</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
                        <span className="text-gray-400">Trade</span><span>{job.category.name}</span>
                        <span className="text-gray-400">Issue</span>
                        <span>{job.issue_type?.name ?? job.custom_issue ?? '—'}</span>
                        <span className="text-gray-400">Urgency</span>
                        <span className="capitalize">{job.urgency.replace('_', ' ')}</span>
                        <span className="text-gray-400">Submitted</span>
                        <span>{new Date(job.submitted_at).toLocaleDateString('en-AU')}</span>
                    </div>
                    <p className="border-t border-gray-100 pt-3 text-gray-700">{job.description}</p>
                </CardBody>
            </Card>

            {/* Status timeline */}
            {job.status_logs.length > 0 && (
                <Card>
                    <CardBody>
                        <h2 className="mb-3 text-sm font-semibold text-gray-700">Activity</h2>
                        <ol className="space-y-3">
                            {job.status_logs.map((log) => (
                                <li key={log.id} className="flex gap-3 text-sm">
                                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 translate-y-1.5 rounded-full bg-gray-300" />
                                    <div>
                                        <span className="font-medium capitalize text-gray-700">
                                            {log.to_status.replace(/_/g, ' ')}
                                        </span>
                                        {log.note && <span className="text-gray-400"> — {log.note}</span>}
                                        <p className="text-xs text-gray-400">
                                            {new Date(log.created_at).toLocaleString('en-AU')}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </CardBody>
                </Card>
            )}

            {/* Review form */}
            {awaitingReview && <ReviewForm job={job} />}

            {/* Review submitted */}
            {job.review && !job.review.was_auto_confirmed && (
                <Card>
                    <CardBody className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <h2 className="text-sm font-semibold text-gray-700">Review submitted</h2>
                        </div>
                        <div className="flex gap-0.5">
                            {STAR_VALUES.map((n) => (
                                <Star
                                    key={n}
                                    className={`h-4 w-4 ${n <= job.review!.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                                />
                            ))}
                        </div>
                        {job.review.review_text && (
                            <p className="text-sm text-gray-600">"{job.review.review_text}"</p>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Cancel */}
            {isCancellable && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={cancelJob}
                        className="text-sm text-red-500 hover:text-red-700"
                    >
                        Cancel this request
                    </button>
                </div>
            )}
        </div>
    );
}

JobShow.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
