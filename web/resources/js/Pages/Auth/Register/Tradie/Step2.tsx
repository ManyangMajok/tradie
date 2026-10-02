import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthLayout from '../../../../Layouts/AuthLayout';
import { Button } from '../../../../Components/ui/Button';
import { Card, CardBody } from '../../../../Components/ui/Card';
import { CheckCircle2 } from 'lucide-react';

interface Category { id: number; slug: string; name: string; }
interface SuburbItem { id: number; name: string; postcode: string; state: string; }
interface Draft { category_ids?: number[]; suburb_ids?: number[]; }

interface Props {
    categories: Category[];
    suburbs: SuburbItem[];
    draft: Draft;
}

export default function TradieStep2({ categories, suburbs, draft }: Props) {
    const [selectedCategories, setSelectedCategories] = useState<number[]>(draft.category_ids ?? []);
    const [selectedSuburbs, setSelectedSuburbs] = useState<number[]>(draft.suburb_ids ?? []);
    const [suburbSearch, setSuburbSearch] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const filteredSuburbs = suburbs.filter((s) =>
        s.name.toLowerCase().includes(suburbSearch.toLowerCase()) ||
        s.postcode.includes(suburbSearch)
    ).slice(0, 30);

    function toggleCategory(id: number) {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function toggleSuburb(id: number) {
        setSelectedSuburbs((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (selectedCategories.length === 0) errs.category_ids = 'Please select at least one trade category.';
        if (selectedSuburbs.length === 0) errs.suburb_ids = 'Please select at least one service area.';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setProcessing(true);
        router.post('/register/tradie/step-2', {
            category_ids: selectedCategories,
            suburb_ids: selectedSuburbs,
        }, { onFinish: () => setProcessing(false) });
    }

    return (
        <AuthLayout title="Apply as a tradie" subtitle="Step 2 of 4 — Categories &amp; service areas">
            <form onSubmit={submit} className="space-y-5">
                <Card>
                    <CardBody>
                        <p className="mb-3 text-sm font-medium text-gray-900">Trade categories <span className="text-red-500">*</span></p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {categories.map((cat) => {
                                const selected = selectedCategories.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                                            selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {selected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.category_ids && <p className="mt-2 text-sm text-red-600">{errors.category_ids}</p>}
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <p className="mb-3 text-sm font-medium text-gray-900">
                            Service areas <span className="text-red-500">*</span>
                            {selectedSuburbs.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">{selectedSuburbs.length} selected</span>
                            )}
                        </p>
                        <input
                            type="search"
                            placeholder="Search area or postal code…"
                            value={suburbSearch}
                            onChange={(e) => setSuburbSearch(e.target.value)}
                            className="mb-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <div className="max-h-56 overflow-y-auto space-y-1">
                            {filteredSuburbs.map((s) => {
                                const selected = selectedSuburbs.includes(s.id);
                                return (
                                    <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleSuburb(s.id)}
                                            className="rounded border-gray-300 text-brand-500"
                                        />
                                        <span className="text-sm text-gray-700">{s.name} {s.postcode}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {errors.suburb_ids && <p className="mt-2 text-sm text-red-600">{errors.suburb_ids}</p>}
                    </CardBody>
                </Card>

                <Button type="submit" className="w-full" loading={processing}>
                    Continue
                </Button>
            </form>
        </AuthLayout>
    );
}
