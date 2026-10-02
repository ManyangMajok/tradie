import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../../Layouts/AuthLayout';
import { Button } from '../../../Components/ui/Button';
import { Input } from '../../../Components/ui/Input';
import { FormField } from '../../../Components/ui/FormField';
import { Card, CardBody } from '../../../Components/ui/Card';
import { Suburb } from '../../../Types/domain';

interface Props {
    suburbs: Suburb[];
}

const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'other', label: 'Other' },
];

export default function MemberProperty({ suburbs }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        label: 'Home',
        address_line_1: '',
        address_line_2: '',
        suburb_id: '',
        property_type: 'house',
        gate_code: '',
        access_notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register/member/property');
    }

    return (
        <AuthLayout title="Add your first property" subtitle="Step 2 of 3 — Property details">
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <FormField label="Property nickname" error={errors.label} required hint='e.g. "Home" or "Rental 1"'>
                            <Input
                                value={data.label}
                                onChange={(e) => setData('label', e.target.value)}
                                error={errors.label}
                            />
                        </FormField>

                        <FormField label="Street address" error={errors.address_line_1} required>
                            <Input
                                value={data.address_line_1}
                                onChange={(e) => setData('address_line_1', e.target.value)}
                                autoComplete="address-line1"
                                error={errors.address_line_1}
                            />
                        </FormField>

                        <FormField label="Area" error={errors.suburb_id} required>
                            <select
                                value={data.suburb_id}
                                onChange={(e) => setData('suburb_id', e.target.value)}
                                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.suburb_id ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select suburb…</option>
                                {suburbs.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.postcode}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="Property type" error={errors.property_type} required>
                            <select
                                value={data.property_type}
                                onChange={(e) => setData('property_type', e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            >
                                {propertyTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
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
