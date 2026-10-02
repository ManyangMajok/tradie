import React, { useState } from 'react';
import TradieLayout from '../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../Components/ui/Card';
import { Button } from '../../Components/ui/Button';
import { MapPin, X } from 'lucide-react';

interface ServiceArea { id: number; suburb_id: number; suburb_name: string; postcode: string; }
interface SuburbItem { id: number; name: string; postcode: string; state: string; }

interface Props {
    service_areas: ServiceArea[];
    suburbs: SuburbItem[];
}

export default function ServiceAreas({ service_areas, suburbs }: Props) {
    const [adding, setAdding] = useState(false);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    const existingIds = new Set(service_areas.map((sa) => sa.suburb_id));
    const filtered = suburbs
        .filter((s) => !existingIds.has(s.id) && (
            s.name.toLowerCase().includes(search.toLowerCase()) || s.postcode.includes(search)
        ))
        .slice(0, 20);

    function add(suburbId: number) {
        setProcessing(true);
        router.post('/tradie/service-areas', { suburb_id: suburbId }, {
            onFinish: () => { setProcessing(false); setAdding(false); setSearch(''); },
        });
    }

    function remove(id: number) {
        router.delete(`/tradie/service-areas/${id}`);
    }

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
                    <p className="mt-1 text-sm text-gray-500">Locations where you accept jobs.</p>
                </div>
                <Button size="sm" onClick={() => setAdding((v) => !v)}>
                    {adding ? 'Cancel' : 'Add suburb'}
                </Button>
            </div>

            {adding && (
                <Card className="mt-4">
                    <CardBody>
                        <input
                            type="search"
                            autoFocus
                            placeholder="Search area or postal code…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                            {filtered.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    disabled={processing}
                                    onClick={() => add(s.id)}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                    {s.name} {s.postcode}
                                </button>
                            ))}
                            {search && filtered.length === 0 && (
                                <p className="py-2 text-center text-sm text-gray-400">No results</p>
                            )}
                        </div>
                    </CardBody>
                </Card>
            )}

            <Card className="mt-4">
                <CardBody>
                    {service_areas.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">No service areas yet. Add a suburb above.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {service_areas.map((sa) => (
                                <li key={sa.id} className="flex items-center justify-between py-2.5">
                                    <span className="text-sm text-gray-700">{sa.suburb_name} {sa.postcode}</span>
                                    <button
                                        type="button"
                                        onClick={() => remove(sa.id)}
                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

ServiceAreas.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
