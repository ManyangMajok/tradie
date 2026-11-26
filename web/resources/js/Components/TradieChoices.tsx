import React, { lazy, Suspense, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
const LocationMap = lazy(() => import('./LocationMap'));

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
    distance_km?: number | null;
    distance_basis?: 'base' | 'area' | null;
    map_latitude?: number | null;
    map_longitude?: number | null;
    map_pin_type?: 'base' | 'area' | null;
}
interface Props {
    tradies: AvailableTradie[];
    selected: number | null;
    onChange: (id: number) => void;
    location: string;
    origin?: { latitude: number | null; longitude: number | null };
    error?: string;
    disabled?: boolean;
}
export default function TradieChoices({ tradies, selected, onChange, location, origin, error, disabled }: Props) {
    const [mapOpen, setMapOpen] = useState(false);
    const points = useMemo(() => {
        const pins = tradies.filter(tradie => tradie.map_latitude != null && tradie.map_longitude != null).map(tradie => ({ id: tradie.id, latitude: Number(tradie.map_latitude), longitude: Number(tradie.map_longitude), label: `${tradie.business_name} · ${tradie.map_pin_type === 'base' ? 'Saved base' : 'Service area centre'} · ${tradie.rating_average == null ? 'Not yet rated' : `${Number(tradie.rating_average).toFixed(1)} / 5`}` }));
        if (origin?.latitude != null && origin.longitude != null) pins.push({ id: 0, latitude: Number(origin.latitude), longitude: Number(origin.longitude), label: 'Your property' });
        return pins;
    }, [tradies, origin?.latitude, origin?.longitude]);
    const alternatives = tradies.length > 0 && tradies[0].match_type === 'alternative';
    return (
        <fieldset disabled={disabled} aria-describedby={error ? 'tradie-choice-error' : undefined} className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">Choose your tradie</legend>
            <p className="text-sm text-gray-600">
                {alternatives
                    ? `No fundis are currently available in ${location}. Consider these alternatives from other service areas. Known approximate distances come first, then same-county matches and ratings.`
                    : `${tradies.length} available ${tradies.length === 1 ? 'fundi' : 'fundis'} serving ${location}, nearest saved locations first, then ratings.`}
                {' '}You choose who receives the request. Your chosen fundi must accept it.
            </p>
            <button type="button" className="action-light" onClick={() => setMapOpen(!mapOpen)} aria-expanded={mapOpen} aria-controls="fundi-results-map"><MapPin className="size-4" aria-hidden="true" />{mapOpen ? 'Hide map' : 'Show map'}</button>
            {mapOpen && <div id="fundi-results-map" className="space-y-3"><p className="text-sm text-gray-600">Select a fundi pin or use the list below. Fundis without a saved base or area centre remain in the list. Pins show saved locations, not live tracking.</p><Suspense fallback={<p role="status">Loading map…</p>}><LocationMap points={points} selected={selected} onSelect={id => { if (id > 0 && !disabled) onChange(id); }} /></Suspense></div>}
            {alternatives && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Travel needs confirmation. These fundis do not list your area in their coverage. Sending a request asks whether they can travel; it does not confirm a booking. Distances are straight-line estimates from saved pins or area centres, not live positions or road distances.</p>}
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
                                    {tradie.match_type === 'alternative' && <span className="block text-sm font-medium text-amber-800">Travel needs confirmation · {tradie.same_county ? 'Same county' : 'Other service area'}</span>}
                                    <span className="block text-sm text-gray-600">{tradie.distance_km != null ? `Approx. ${tradie.distance_km} km · ${tradie.distance_basis === 'base' ? 'property to saved base' : 'between area centres'} (straight line)` : 'Distance unavailable — add a property pin or ask the fundi.'}</span>
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
