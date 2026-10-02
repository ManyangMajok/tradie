import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../../../Layouts/AuthLayout';
import { Button } from '../../../../Components/ui/Button';
import { Card, CardBody } from '../../../../Components/ui/Card';

export default function TradieStep4() {
    const { data, setData, post, processing, errors } = useForm({
        agreed_terms: false,
        agreed_conduct: false,
        agreed_background_check: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register/tradie/step-4');
    }

    return (
        <AuthLayout title="Apply as a tradie" subtitle="Step 4 of 4 — Agreement">
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Please read and agree to the following before submitting your application.
                        </p>

                        <AgreementCheckbox
                            checked={data.agreed_terms}
                            onChange={(v) => setData('agreed_terms', v)}
                            error={errors.agreed_terms}
                        >
                            I agree to the <a href="/terms" className="text-brand-500 hover:underline" target="_blank">Terms and Conditions</a> and <a href="/privacy" className="text-brand-500 hover:underline" target="_blank">Privacy Policy</a>.
                        </AgreementCheckbox>

                        <AgreementCheckbox
                            checked={data.agreed_conduct}
                            onChange={(v) => setData('agreed_conduct', v)}
                            error={errors.agreed_conduct}
                        >
                            I agree to TradeFinder's <span className="font-medium">Code of Conduct</span> — I will respond promptly to leads, treat members professionally, and charge fairly.
                        </AgreementCheckbox>

                        <AgreementCheckbox
                            checked={data.agreed_background_check}
                            onChange={(v) => setData('agreed_background_check', v)}
                            error={errors.agreed_background_check}
                        >
                            I consent to a background and licence check as part of the approval process.
                        </AgreementCheckbox>

                        <Button type="submit" className="mt-2 w-full" loading={processing}>
                            Submit application
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </AuthLayout>
    );
}

function AgreementCheckbox({ checked, onChange, error, children }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex cursor-pointer gap-3">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500"
                />
                <span className="text-sm text-gray-700">{children}</span>
            </label>
            {error && <p className="mt-1 ml-7 text-sm text-red-600">{error}</p>}
        </div>
    );
}
