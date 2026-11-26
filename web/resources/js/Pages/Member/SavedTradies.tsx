import React from 'react';
import { router, useForm } from '@inertiajs/react';
import MemberLayout from '../../Layouts/MemberLayout';
import { Star, Trash2 } from 'lucide-react';

interface SavedTradie {
    id: number;
    saved_at: string;
    company: {
        id: number;
        business_name: string;
        rating_average: number | null;
        rating_count: number;
        categories: string[];
    };
}

interface Props {
    savedTradies: SavedTradie[];
    fundis: {id:number;business_name:string}[];
}

export default function SavedTradies({ savedTradies, fundis }: Props) {
    const form=useForm({tradie_company_id:''});
    function unsave(id: number) {
        router.delete(`/saved-tradies/${id}`, { preserveScroll: true });
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Tradies</h1>
            <p className="mt-1 text-sm text-gray-500">Tradies you've bookmarked for future jobs.</p>

            <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={event=>{event.preventDefault();form.post('/saved-tradies',{onSuccess:()=>form.reset()});}}><div><label htmlFor="save-fundi" className="mb-1 block text-sm font-medium">Choose a fundi to save</label><select id="save-fundi" required value={form.data.tradie_company_id} onChange={event=>form.setData('tradie_company_id',event.target.value)} aria-describedby={form.errors.tradie_company_id?'save-fundi-error':undefined} aria-invalid={!!form.errors.tradie_company_id} className="rounded-lg border border-gray-300 bg-white p-2"><option value="">Select fundi</option>{fundis.map(fundi=><option key={fundi.id} value={fundi.id}>{fundi.business_name}</option>)}</select></div><button disabled={form.processing} className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white">Save fundi</button>{form.errors.tradie_company_id&&<p id="save-fundi-error" role="alert" className="text-red-700">{form.errors.tradie_company_id}</p>}</form>
            {savedTradies.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">You haven't saved any tradies yet.</p>
                    <p className="mt-1 text-xs text-gray-400">Choose a fundi above to add them here.</p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {savedTradies.map(s => (
                        <li key={s.id} className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{s.company.business_name}</p>

                                {s.company.categories.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {s.company.categories.map(cat => (
                                            <span key={cat} className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                    {s.company.rating_count > 0 ? (
                                        <span className="flex items-center gap-1">
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                            {s.company.rating_average?.toFixed(1)} ({s.company.rating_count} review{s.company.rating_count !== 1 ? 's' : ''})
                                        </span>
                                    ) : (
                                        <span>No reviews yet</span>
                                    )}
                                    <span>Saved {s.saved_at}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => unsave(s.id)}
                                className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Remove from saved"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

SavedTradies.layout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;
