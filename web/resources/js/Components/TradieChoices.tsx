import React from 'react';

export interface AvailableTradie {
    id: number;
    business_name: string;
    about_text?: string | null;
    rating_average: number | string | null;
    rating_count: number;
    match_type?: 'local' | 'alternative';
    service_area_names?: string[];
    area_distance_km?: number | null;
    same_county?: boolean;
}
interface Props {
    tradies: AvailableTradie[];
    selected: number | null;
    onChange: (id: number) => void;
    location: string;
    error?: string;
    disabled?: boolean;
}
export default function TradieChoices({ tradies, selected, onChange, location, error, disabled }: Props) {
    const alternatives = tradies.length > 0 && tradies[0].match_type === 'alternative';
    return (
        <fieldset disabled={disabled} aria-describedby={error ? 'tradie-choice-error' : undefined} className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">Choose your tradie</legend>
            <p className="text-sm text-gray-600">
                {alternatives
                    ? `No fundis are currently available in ${location}. Consider these alternatives from other service areas. Known area distances come first, then same-county matches and ratings.`
                    : `${tradies.length} available ${tradies.length === 1 ? 'fundi' : 'fundis'} serving ${location}, highest rated first.`}
                {' '}You choose who receives the request. Your chosen fundi must accept it.
            </p>
            {alternatives && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Travel needs confirmation. These fundis do not list your area in their coverage. Sending a request asks whether they can travel; it does not confirm a booking. Distances, when available, are between service areas, not live fundi positions or road distances.</p>}
            {tradies.length === 0 ? (
                <p role="status" className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    No local fundis or eligible alternatives are available for this trade right now. Try again later or contact the team for help.
                </p>
            ) : (
                <ol className="space-y-3">
                    {tradies.map((tradie, index) => (
                        <li key={tradie.id}>
                            <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 focus-within:ring-2 focus-within:ring-brand-500 ${selected === tradie.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                                <input type="radio" name="selected_tradie_company_id" value={tradie.id}
                                    checked={selected === tradie.id} onChange={() => onChange(tradie.id)}
                                    aria-invalid={Boolean(error)} className="mt-1 accent-brand-500" />
                                <span className="min-w-0 space-y-1">
                                    <span className="block font-semibold text-gray-900">{index + 1}. {tradie.business_name}</span>
                                    <span className="block text-sm text-gray-700">
                                        {tradie.rating_average === null ? 'Not yet rated' : `${Number(tradie.rating_average).toFixed(1)} / 5`}
                                        {' · '}{tradie.rating_count} {tradie.rating_count === 1 ? 'review' : 'reviews'}
                                    </span>
                                    {tradie.service_area_names && <span className="block text-sm text-gray-600">Service areas: {tradie.service_area_names.join(', ')}</span>}
                                    {tradie.match_type === 'alternative' && <span className="block text-sm font-medium text-amber-800">Travel needs confirmation · {tradie.area_distance_km != null ? `Approx. ${tradie.area_distance_km} km between areas` : `${tradie.same_county ? 'Same county · ' : ''}Distance unavailable`}</span>}
                                    {tradie.about_text && <span className="block text-sm text-gray-600">{tradie.about_text}</span>}
                                </span>
                            </label>
                        </li>
                    ))}
                </ol>
            )}
            {error && <p id="tradie-choice-error" role="alert" className="text-sm text-red-600">{error}</p>}
        </fieldset>
    );
}
