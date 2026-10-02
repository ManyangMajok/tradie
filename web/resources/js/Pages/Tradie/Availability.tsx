import React, { useState } from 'react';
import TradieLayout from '../../Layouts/TradieLayout';
import { router } from '@inertiajs/react';
import { Card, CardBody } from '../../Components/ui/Card';
import { Button } from '../../Components/ui/Button';

interface DayRow {
    day_of_week: number;
    day_name: string;
    opens_at: string | null;
    closes_at: string | null;
    is_open: boolean;
    accepts_emergency: boolean;
}

interface Props {
    availability: DayRow[];
}

export default function Availability({ availability: initial }: Props) {
    const [rows, setRows] = useState<DayRow[]>(initial);
    const [processing, setProcessing] = useState(false);

    function setRow(index: number, patch: Partial<DayRow>) {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        router.patch('/tradie/availability', { availability: rows.map((row) => ({ ...row })) }, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="max-w-lg">
            <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
            <p className="mt-1 text-sm text-gray-500">Set your regular operating hours and emergency availability.</p>

            <form onSubmit={submit}>
                <Card className="mt-6">
                    <CardBody className="p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-500">
                                    <th className="px-4 py-3 text-left font-medium">Day</th>
                                    <th className="px-4 py-3 text-left font-medium">Open?</th>
                                    <th className="px-4 py-3 text-left font-medium">Opens</th>
                                    <th className="px-4 py-3 text-left font-medium">Closes</th>
                                    <th className="px-4 py-3 text-left font-medium">Emergency?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rows.map((row, i) => (
                                    <tr key={row.day_of_week}>
                                        <td className="px-4 py-2.5 font-medium text-gray-700">{row.day_name}</td>
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={row.is_open}
                                                onChange={(e) => setRow(i, { is_open: e.target.checked })}
                                                className="rounded border-gray-300 text-brand-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="time"
                                                value={row.opens_at ?? ''}
                                                disabled={!row.is_open}
                                                onChange={(e) => setRow(i, { opens_at: e.target.value || null })}
                                                className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                                            />
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="time"
                                                value={row.closes_at ?? ''}
                                                disabled={!row.is_open}
                                                onChange={(e) => setRow(i, { closes_at: e.target.value || null })}
                                                className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                                            />
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={row.accepts_emergency}
                                                onChange={(e) => setRow(i, { accepts_emergency: e.target.checked })}
                                                className="rounded border-gray-300 text-brand-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>

                <Button type="submit" className="mt-4 w-full" loading={processing}>
                    Save availability
                </Button>
            </form>
        </div>
    );
}

Availability.layout = (page: React.ReactNode) => <TradieLayout>{page}</TradieLayout>;
