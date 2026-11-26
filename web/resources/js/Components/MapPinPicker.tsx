import React, { lazy, Suspense, useId, useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
const LocationMap = lazy(() => import('./LocationMap'));
interface Props { latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void; title: string; help: string; errors?: { latitude?: string; longitude?: string }; showFields?: boolean }
export default function MapPinPicker({ latitude, longitude, onChange, title, help, errors = {}, showFields = true }: Props) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const points = useMemo(() => latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) ? [{ id: 0, latitude: Number(latitude), longitude: Number(longitude), label: title }] : [], [latitude, longitude, title]);
    return <section className="space-y-3 rounded-2xl border border-gray-200 p-4" aria-labelledby={id}>
        <h2 id={id} className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-gray-600">{help} Click the map to place or move the pin. Save the form to keep changes.</p>
        <div className="flex flex-wrap gap-3"><button type="button" className="action-light" aria-expanded={open} aria-controls={`${id}-map`} onClick={() => setOpen(!open)}><MapPin className="size-4" aria-hidden="true" />{open ? 'Hide map' : 'Open map'}</button><button type="button" className="action-light" onClick={() => onChange('', '')} disabled={!latitude && !longitude}><X className="size-4" aria-hidden="true" />Clear pin</button></div>
        {open && <div id={`${id}-map`}><Suspense fallback={<p role="status">Loading map…</p>}><LocationMap points={points} selected={0} onPick={(lat, lng) => onChange(String(lat), String(lng))} /></Suspense></div>}
        {showFields && <div className="grid gap-3 sm:grid-cols-2">{(['latitude', 'longitude'] as const).map(field => <div key={field}><label htmlFor={`${id}-${field}`} className="mb-1 block text-sm font-medium">{field === 'latitude' ? 'Latitude' : 'Longitude'} (optional)</label><input id={`${id}-${field}`} type="number" step="any" min={field === 'latitude' ? -90 : -180} max={field === 'latitude' ? 90 : 180} value={field === 'latitude' ? latitude : longitude} onChange={event => field === 'latitude' ? onChange(event.target.value, longitude) : onChange(latitude, event.target.value)} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${id}-${field}-error` : undefined} className="w-full rounded-lg border border-gray-300 p-2" />{errors[field] && <p id={`${id}-${field}-error`} className="mt-1 text-sm text-red-700">{errors[field]}</p>}</div>)}</div>}
    </section>;
}
