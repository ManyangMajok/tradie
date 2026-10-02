import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../Components/ui/Card';
import { Button } from '../../Components/ui/Button';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';

interface Owner {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

interface Application {
    id: number;
    business_name: string;
    abn: string | null;
    licence_number: string | null;
    licence_state: string | null;
    licence_expires_on: string | null;
    insurance_expires_on: string | null;
    licence_document_path: string | null;
    insurance_document_path: string | null;
    created_at: string;
    owner: Owner;
}

interface Props {
    applications: Application[];
}

export default function Applications({ applications }: Props) {
    function approve(id: number) {
        router.post(`/admin/applications/${id}/approve`);
    }

    function reject(id: number) {
        const reason = prompt('Reason for rejection (optional):') ?? '';
        router.post(`/admin/applications/${id}/reject`, { reason });
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Applications</h1>
            <p className="mt-1 text-sm text-gray-500">{applications.length} application{applications.length !== 1 ? 's' : ''} awaiting review</p>

            {applications.length === 0 ? (
                <Card className="mt-6">
                    <CardBody>
                        <p className="py-8 text-center text-sm text-gray-500">No pending applications.</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="mt-6 space-y-4">
                    {applications.map((app) => (
                        <Card key={app.id}>
                            <CardBody>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{app.business_name}</h2>
                                        <p className="mt-0.5 text-sm text-gray-500">
                                            {app.owner.first_name} {app.owner.last_name} · {app.owner.email} · {app.owner.phone}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                                            {app.abn && <span>Business registration: {app.abn}</span>}
                                            {app.licence_number && <span>Licence: {app.licence_number} ({app.licence_state})</span>}
                                            {app.licence_expires_on && <span>Lic. exp: {app.licence_expires_on}</span>}
                                            {app.insurance_expires_on && <span>Ins. exp: {app.insurance_expires_on}</span>}
                                        </div>
                                        <div className="mt-2 flex gap-3 text-xs">
                                            {app.licence_document_path && (
                                                <a href={`/admin/documents/${encodeURIComponent(app.licence_document_path)}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline" rel="noreferrer">
                                                    <FileText className="h-3.5 w-3.5" /> Licence doc
                                                </a>
                                            )}
                                            {app.insurance_document_path && (
                                                <a href={`/admin/documents/${encodeURIComponent(app.insurance_document_path)}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline" rel="noreferrer">
                                                    <FileText className="h-3.5 w-3.5" /> Insurance doc
                                                </a>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-gray-400">Applied {app.created_at}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => approve(app.id)}
                                            size="sm"
                                            className="gap-1.5"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => reject(app.id)}
                                            variant="destructive"
                                            size="sm"
                                            className="gap-1.5"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

Applications.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
