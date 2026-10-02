import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { FormField } from '../../Components/ui/FormField';
import { Card, CardBody } from '../../Components/ui/Card';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/password/reset');
    }

    return (
        <AuthLayout title="Set a new password">
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Email address" error={errors.email} required>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                            />
                        </FormField>

                        <FormField label="New password" error={errors.password} required>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                error={errors.password}
                            />
                        </FormField>

                        <FormField label="Confirm new password" error={errors.password_confirmation} required>
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                error={errors.password_confirmation}
                            />
                        </FormField>

                        <Button type="submit" className="w-full" loading={processing}>
                            Reset password
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </AuthLayout>
    );
}
