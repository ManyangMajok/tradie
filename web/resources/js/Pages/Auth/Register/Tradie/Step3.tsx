import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthLayout from '../../../../Layouts/AuthLayout';
import { Button } from '../../../../Components/ui/Button';
import { Input } from '../../../../Components/ui/Input';
import { FormField } from '../../../../Components/ui/FormField';
import { Card, CardBody } from '../../../../Components/ui/Card';
import { Upload, CheckCircle2 } from 'lucide-react';

interface Props {
    draft?: Record<string, string>;
}

const states = ['KE'];

export default function TradieStep3({ draft = {} }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        licence_number: draft.licence_number ?? '',
        licence_state: draft.licence_state ?? 'KE',
        licence_expires_on: draft.licence_expires_on ?? '',
        insurance_expires_on: draft.insurance_expires_on ?? '',
        licence_document_path: draft.licence_document_path ?? '',
        insurance_document_path: draft.insurance_document_path ?? '',
    });

    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    async function uploadFile(field: 'licence_document_path' | 'insurance_document_path', file: File) {
        setUploading((p) => ({ ...p, [field]: true }));
        const formData = new FormData();
        formData.append('file', file);

        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        const res = await fetch('/register/tradie/upload-doc', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': csrf },
            body: formData,
        });

        if (res.ok) {
            const json = await res.json();
            setData(field, json.path);
        }
        setUploading((p) => ({ ...p, [field]: false }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register/tradie/step-3');
    }

    return (
        <AuthLayout title="Apply as a tradie" subtitle="Step 3 of 4 — Credentials">
            <Card>
                <CardBody>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Licence number" error={errors.licence_number} required>
                                <Input value={data.licence_number} onChange={(e) => setData('licence_number', e.target.value)} error={errors.licence_number} />
                            </FormField>
                            <FormField label="Licence country" error={errors.licence_state} required>
                                <select
                                    value={data.licence_state}
                                    onChange={(e) => setData('licence_state', e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {states.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Licence expires" error={errors.licence_expires_on} required>
                                <Input type="date" value={data.licence_expires_on} onChange={(e) => setData('licence_expires_on', e.target.value)} error={errors.licence_expires_on} />
                            </FormField>
                            <FormField label="Insurance expires" error={errors.insurance_expires_on} required>
                                <Input type="date" value={data.insurance_expires_on} onChange={(e) => setData('insurance_expires_on', e.target.value)} error={errors.insurance_expires_on} />
                            </FormField>
                        </div>

                        <FileUploadField
                            label="Licence document"
                            field="licence_document_path"
                            path={data.licence_document_path}
                            uploading={uploading.licence_document_path}
                            error={errors.licence_document_path}
                            onFile={(f) => uploadFile('licence_document_path', f)}
                        />

                        <FileUploadField
                            label="Insurance certificate"
                            field="insurance_document_path"
                            path={data.insurance_document_path}
                            uploading={uploading.insurance_document_path}
                            error={errors.insurance_document_path}
                            onFile={(f) => uploadFile('insurance_document_path', f)}
                        />

                        <Button type="submit" className="w-full" loading={processing}>
                            Continue
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </AuthLayout>
    );
}

function FileUploadField({ label, path, uploading, error, onFile }: {
    label: string;
    field: string;
    path: string;
    uploading?: boolean;
    error?: string;
    onFile: (f: File) => void;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label} <span className="text-red-500">*</span>
            </label>
            <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
                path ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
            }`}>
                <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
                {path ? (
                    <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700">Uploaded</span>
                    </>
                ) : uploading ? (
                    <span className="text-sm text-gray-500">Uploading…</span>
                ) : (
                    <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload PDF, JPG, or PNG (max 10 MB)</span>
                    </>
                )}
            </label>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
