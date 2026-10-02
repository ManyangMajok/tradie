import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../../../Layouts/AuthLayout';
import { Button } from '../../../../Components/ui/Button';
import { Input } from '../../../../Components/ui/Input';
import { FormField } from '../../../../Components/ui/FormField';
import { Card, CardBody } from '../../../../Components/ui/Card';

interface Props {
    draft?: Record<string, string>;
}

export default function TradieStep1({ draft = {} }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: draft.first_name ?? '',
        last_name: draft.last_name ?? '',
        email: draft.email ?? '',
        phone: draft.phone ?? '',
        password: '',
        password_confirmation: '',
        business_name: draft.business_name ?? '',
        trading_name: draft.trading_name ?? '',
        abn: draft.abn ?? '',
        about_text: draft.about_text ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register/tradie/step-1');
    }

    return (
        <AuthLayout title="Apply as a tradie" subtitle="Step 1 of 4 — Account &amp; business details">
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="First name" error={errors.first_name} required>
                                <Input value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} autoComplete="given-name" error={errors.first_name} />
                            </FormField>
                            <FormField label="Last name" error={errors.last_name} required>
                                <Input value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} autoComplete="family-name" error={errors.last_name} />
                            </FormField>
                        </div>

                        <FormField label="Email address" error={errors.email} required>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} autoComplete="email" error={errors.email} />
                        </FormField>

                        <FormField label="Mobile number" error={errors.phone} required hint="Kenyan mobile, e.g. +254712345678">
                            <Input type="tel" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+254712345678" error={errors.phone} />
                        </FormField>

                        <FormField label="Password" error={errors.password} required>
                            <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" error={errors.password} />
                        </FormField>

                        <FormField label="Confirm password" error={errors.password_confirmation} required>
                            <Input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" error={errors.password_confirmation} />
                        </FormField>

                        <hr className="border-gray-100" />

                        <FormField label="Business name" error={errors.business_name} required>
                            <Input value={data.business_name} onChange={(e) => setData('business_name', e.target.value)} error={errors.business_name} />
                        </FormField>

                        <FormField label="Trading name" error={errors.trading_name} hint="If different from business name">
                            <Input value={data.trading_name} onChange={(e) => setData('trading_name', e.target.value)} error={errors.trading_name} />
                        </FormField>

                        <FormField label="Business registration number" error={errors.abn} hint="Optional business registration reference (demo)">
                            <Input value={data.abn} onChange={(e) => setData('abn', e.target.value)} placeholder="DEMO-KE-001" error={errors.abn} />
                        </FormField>

                        <FormField label="About your business" error={errors.about_text} hint="Optional — shown to members">
                            <textarea
                                value={data.about_text}
                                onChange={(e) => setData('about_text', e.target.value)}
                                rows={3}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </FormField>

                        <Button type="submit" className="w-full" loading={processing}>
                            Continue
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </AuthLayout>
    );
}
