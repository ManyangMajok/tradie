import React, { useState } from 'react';
import MemberLayout from '../../../Layouts/MemberLayout';
import { Link, router } from '@inertiajs/react';
import TradieChoices, { type AvailableTradie } from '../../../Components/TradieChoices';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Button } from '../../../Components/ui/Button';
import { ChevronLeft } from 'lucide-react';

interface Property {
    id: number;
    label: string;
    address_line_1: string;
    suburb?: { name: string; postcode: string };
}
interface Category {
    id: number;
    name: string;
    slug: string;
}
interface IssueType {
    id: number;
    tradie_category_id: number;
    name: string;
}
interface Props {
    properties: Property[];
    categories: Category[];
    issue_types: IssueType[];
}

type Urgency = 'emergency' | 'same_day' | 'within_48h' | 'flexible';

interface WizardState {
    property_id: number | null;
    tradie_category_id: number | null;
    issue_type_id: number | null;
    custom_issue: string;
    urgency: Urgency | null;
    description: string;
    best_contact_time: string;
    selected_tradie_company_id: number | null;
}

const URGENCY_OPTIONS: { value: Urgency; label: string; hint: string }[] = [
    { value: 'emergency', label: 'Emergency', hint: 'Needs a tradie within hours' },
    { value: 'same_day', label: 'Same day', hint: 'Today if possible' },
    { value: 'within_48h', label: 'Within 48 hours', hint: 'This week' },
    { value: 'flexible', label: 'Flexible', hint: 'No rush' },
];

export default function JobsWizard({ properties, categories, issue_types }: Props) {
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(
        properties.length === 1 ? 2 : 1
    );
    const [state, setState] = useState<WizardState>({
        property_id: properties.length === 1 ? properties[0].id : null,
        tradie_category_id: null,
        issue_type_id: null,
        custom_issue: '',
        urgency: null,
        description: '',
        best_contact_time: '',
        selected_tradie_company_id: null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [loadingTradies, setLoadingTradies] = useState(false);
    const [tradies, setTradies] = useState<AvailableTradie[]>([]);
    const [location, setLocation] = useState('');

    async function loadTradies() {
        setLoadingTradies(true);
        setErrors({});
        try {
            const query = new URLSearchParams({
                property_id: String(state.property_id),
                tradie_category_id: String(state.tradie_category_id),
                urgency: state.urgency ?? '',
            });
            const response = await fetch(`/jobs/available-tradies?${query}`, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('Unable to load tradies. Check your property and trade, then try again.');
            const data = await response.json() as { tradies: AvailableTradie[]; location: string };
            setTradies(data.tradies);
            setLocation(data.location);
            setState((previous) => ({ ...previous, selected_tradie_company_id: null }));
            setStep(6);
        } catch (error) {
            setErrors({ tradies: error instanceof Error ? error.message : 'Unable to load tradies. Please try again.' });
        } finally {
            setLoadingTradies(false);
        }
    }

    const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const selectedCategory = categories.find((c) => c.id === state.tradie_category_id);
    const filteredIssues = issue_types.filter(
        (i) => i.tradie_category_id === state.tradie_category_id
    );

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (step === 1 && !state.property_id) errs.property_id = 'Select a property.';
        if (step === 2 && !state.tradie_category_id) errs.tradie_category_id = 'Select a trade type.';
        if (step === 3 && !state.issue_type_id && !state.custom_issue.trim())
            errs.issue_type_id = 'Select or describe the issue.';
        if (step === 4 && !state.urgency) errs.urgency = 'Select how urgent this is.';
        if (step === 5 && state.description.trim().length < 10)
            errs.description = 'Please describe the issue in at least 10 characters.';
        if (step === 6 && !state.selected_tradie_company_id)
            errs.selected_tradie_company_id = 'Choose a tradie to send your request to.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function next() {
        if (!validate()) return;
        if (step === 5) {
            void loadTradies();
            return;
        }
        setStep((s) => Math.min(s + 1, 6) as typeof step);
    }

    function back() {
        const prev = step - 1;
        // Skip property step if only one property
        if (prev === 1 && properties.length === 1) return;
        setStep(Math.max(prev, 1) as typeof step);
    }

    function submit() {
        if (!validate()) return;
        setProcessing(true);
        router.post('/jobs', {
            selected_tradie_company_id: state.selected_tradie_company_id,
            property_id: state.property_id,
            tradie_category_id: state.tradie_category_id,
            issue_type_id: state.issue_type_id || null,
            custom_issue: state.custom_issue || null,
            urgency: state.urgency,
            description: state.description,
            best_contact_time: state.best_contact_time || null,
        }, {
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    }

    const totalSteps = properties.length === 1 ? 5 : 6;
    const currentProgress = step - (properties.length === 1 ? 1 : 0);

    return (
        <div className="mx-auto max-w-lg">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Request a tradie</h1>
                <span className="text-sm text-gray-400">Step {currentProgress} of {totalSteps}</span>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-1.5 w-full rounded-full bg-gray-100">
                <div
                    className="h-1.5 rounded-full bg-brand-500 transition-all"
                    style={{ width: `${(currentProgress / totalSteps) * 100}%` }}
                />
            </div>

            <Card>
                <CardBody className="space-y-4 p-6">
                    {/* Step 1: Property */}
                    {step === 1 && (
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Which property?</h2>
                            <div className="space-y-2">
                                {properties.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => set('property_id', p.id)}
                                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                            state.property_id === p.id
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <p className="font-medium text-gray-900">{p.label}</p>
                                        <p className="text-sm text-gray-500">
                                            {p.address_line_1}
                                            {p.suburb && `, ${p.suburb.name} ${p.suburb.postcode}`}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            {errors.property_id && <p className="mt-1 text-sm text-red-600">{errors.property_id}</p>}
                        </div>
                    )}

                    {/* Step 2: Category */}
                    {step === 2 && (
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">What trade do you need?</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            set('tradie_category_id', c.id);
                                            set('issue_type_id', null);
                                        }}
                                        className={`rounded-lg border p-3 text-left font-medium transition-colors ${
                                            state.tradie_category_id === c.id
                                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                            {errors.tradie_category_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.tradie_category_id}</p>
                            )}
                        </div>
                    )}

                    {/* Step 3: Issue type */}
                    {step === 3 && (
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                                What's the issue with your {selectedCategory?.name.toLowerCase()}?
                            </h2>
                            <div className="space-y-2">
                                {filteredIssues.map((i) => (
                                    <button
                                        key={i.id}
                                        type="button"
                                        onClick={() => {
                                            set('issue_type_id', i.id);
                                            set('custom_issue', '');
                                        }}
                                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                            state.issue_type_id === i.id
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {i.name}
                                    </button>
                                ))}
                                <div className="mt-3">
                                    <label htmlFor="custom-issue" className="mb-1 block text-sm font-medium text-gray-700">
                                        Describe the issue
                                    </label>
                                    <input
                                        type="text"
                                        id="custom-issue"
                                        maxLength={200}
                                        value={state.custom_issue}
                                        onChange={(e) => {
                                            set('custom_issue', e.target.value);
                                            set('issue_type_id', null);
                                        }}
                                        placeholder="e.g. Blocked stormwater drain"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            {errors.issue_type_id && (
                                <p className="mt-1 text-sm text-red-600">{errors.issue_type_id}</p>
                            )}
                        </div>
                    )}

                    {/* Step 4: Urgency */}
                    {step === 4 && (
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">How urgent is it?</h2>
                            <div className="space-y-2">
                                {URGENCY_OPTIONS.map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => set('urgency', o.value)}
                                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                            state.urgency === o.value
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <p className="font-medium text-gray-900">{o.label}</p>
                                        <p className="text-sm text-gray-500">{o.hint}</p>
                                    </button>
                                ))}
                            </div>
                            {errors.urgency && <p className="mt-1 text-sm text-red-600">{errors.urgency}</p>}
                        </div>
                    )}

                    {/* Step 5: Description + submit */}
                    {step === 5 && (
                        <div>
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">Describe the problem</h2>
                            <label htmlFor="job-description" className="sr-only">Problem description</label>
                            <textarea
                                id="job-description"
                                maxLength={2000}
                                value={state.description}
                                onChange={(e) => set('description', e.target.value)}
                                rows={5}
                                placeholder="Tell us what's happening — the more detail the better. When did it start? What have you already tried?"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                            <div className="mt-4">
                                <label htmlFor="best-contact" className="mb-1 block text-sm font-medium text-gray-700">
                                    Best time to contact you (optional)
                                </label>
                                <input
                                    type="text"
                                    id="best-contact"
                                    maxLength={100}
                                    value={state.best_contact_time}
                                    onChange={(e) => set('best_contact_time', e.target.value)}
                                    placeholder="e.g. Mornings, after 5pm, anytime"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                    {step === 6 && (
                        <>
                            <TradieChoices tradies={tradies} selected={state.selected_tradie_company_id}
                                onChange={(id) => set('selected_tradie_company_id', id)} location={location}
                                error={errors.selected_tradie_company_id} disabled={processing || loadingTradies} />
                            <Button variant="secondary" onClick={() => void loadTradies()} disabled={processing} loading={loadingTradies}>
                                Refresh availability
                            </Button>
                        </>
                    )}
                    {Object.entries(errors).some(([key, message]) => key !== 'selected_tradie_company_id' && message) && (
                        <div role="alert" className="text-sm text-red-600">
                            {Object.entries(errors).filter(([key]) => key !== 'selected_tradie_company_id').map(([key, message]) => message && <p key={key}>{message}</p>)}
                        </div>
                    )}
                    {properties.length === 0 && <Link href="/register/member/property" className="text-sm text-brand-500 underline">Add a property to find local tradies</Link>}
                </CardBody>
            </Card>

            {/* Navigation */}
            <div className="mt-4 flex justify-between">
                <div>
                    {step > 1 && properties.length > 1 && (
                        <button
                            type="button"
                            onClick={back}
                            disabled={processing || loadingTradies}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                    )}
                    {step > 2 && properties.length === 1 && (
                        <button
                            type="button"
                            onClick={back}
                            disabled={processing || loadingTradies}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                    )}
                </div>

                {step < 6 ? (
                    <Button onClick={next} loading={loadingTradies} disabled={properties.length === 0}>
                        {step === 5 ? 'Find local tradies' : 'Continue'}
                    </Button>
                ) : (
                    <Button onClick={submit} loading={processing} disabled={loadingTradies || tradies.length === 0}>
                        Send to chosen tradie
                    </Button>
                )}
            </div>
        </div>
    );
}

JobsWizard.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
