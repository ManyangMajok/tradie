import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';
import { Button } from '../../Components/ui/Button';
import { Input } from '../../Components/ui/Input';
import { FormField } from '../../Components/ui/FormField';
import { Card, CardBody } from '../../Components/ui/Card';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Sign in to the TradeFinder admin workspace">
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

                        <FormField label="Password" error={errors.password} required>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                error={errors.password}
                            />
                        </FormField>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded"
                                />
                                Remember me
                            </label>

                        </div>

                        <Button type="submit" className="w-full" loading={processing}>
                            Sign in
                        </Button>
                    </form>
                </CardBody>
            </Card>


        </AuthLayout>
    );
}
