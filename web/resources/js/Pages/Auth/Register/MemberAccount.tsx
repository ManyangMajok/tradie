import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../../Layouts/AuthLayout';
import { Button } from '../../../Components/ui/Button';
import { Input } from '../../../Components/ui/Input';
import { FormField } from '../../../Components/ui/FormField';
import { Card, CardBody } from '../../../Components/ui/Card';

export default function MemberAccount() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register/member');
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Step 1 of 3 — Account details"
        >
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="First name" error={errors.first_name} required>
                                <Input
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    autoComplete="given-name"
                                    error={errors.first_name}
                                />
                            </FormField>
                            <FormField label="Last name" error={errors.last_name} required>
                                <Input
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    autoComplete="family-name"
                                    error={errors.last_name}
                                />
                            </FormField>
                        </div>

                        <FormField label="Email address" error={errors.email} required>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="email"
                                error={errors.email}
                            />
                        </FormField>

                        <FormField
                            label="Mobile number"
                            error={errors.phone}
                            required
                            hint="Kenyan mobile, e.g. +254712345678"
                        >
                            <Input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                autoComplete="tel"
                                placeholder="+254712345678"
                                error={errors.phone}
                            />
                        </FormField>

                        <FormField label="Password" error={errors.password} required>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                error={errors.password}
                            />
                        </FormField>

                        <FormField label="Confirm password" error={errors.password_confirmation} required>
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                error={errors.password_confirmation}
                            />
                        </FormField>

                        <Button type="submit" className="w-full" loading={processing}>
                            Continue
                        </Button>
                    </form>
                </CardBody>
            </Card>

            <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
