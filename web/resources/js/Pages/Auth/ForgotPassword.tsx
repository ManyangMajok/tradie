import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { FormField } from '../../Components/ui/FormField';
import { Card, CardBody } from '../../Components/ui/Card';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/password/forgot');
    }

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your email and we'll send you a reset link."
        >
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Email address" error={errors.email} required>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                autoComplete="email"
                                error={errors.email}
                            />
                        </FormField>

                        <Button type="submit" className="w-full" loading={processing}>
                            Send reset link
                        </Button>
                    </form>
                </CardBody>
            </Card>

            <p className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="text-brand-500 hover:underline">
                    Back to sign in
                </Link>
            </p>
        </AuthLayout>
    );
}
