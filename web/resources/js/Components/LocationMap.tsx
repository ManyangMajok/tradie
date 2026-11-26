import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapPoint { id: number; latitude: number; longitude: number; label: string }
interface Props { points: MapPoint[]; selected?: number | null; onSelect?: (id: number) => void; onPick?: (latitude: number, longitude: number) => void }
const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function LocationMap({ points, selected, onSelect, onPick }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const markers = useRef<L.LayerGroup | null>(null);
    const callbacks = useRef({ onPick, onSelect });
    const [tileError, setTileError] = useState(false);
    useEffect(() => { callbacks.current = { onPick, onSelect }; }, [onPick, onSelect]);
    useEffect(() => {
        if (!container.current) return;
        const instance = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([-1.3, 36.8], 7);
        map.current = instance;
        markers.current = L.layerGroup().addTo(instance);
        L.tileLayer(tileUrl, { attribution, maxZoom: 19, keepBuffer: 0, updateWhenIdle: true, referrerPolicy: 'strict-origin-when-cross-origin' })
            .on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(instance);
        instance.on('click', (event: L.LeafletMouseEvent) => {
            const point = event.latlng.wrap();
            callbacks.current.onPick?.(Number(point.lat.toFixed(6)), Number(point.lng.toFixed(6)));
        });
        const observer = new ResizeObserver(() => instance.invalidateSize({ animate: false }));
        observer.observe(container.current);
        return () => { observer.disconnect(); instance.remove(); map.current = null; markers.current = null; };
    }, []);
    useEffect(() => {
        if (!map.current || !markers.current) return;
        markers.current.clearLayers();
        const valid = points.filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180);
        for (const point of valid) {
            const marker = L.marker([point.latitude, point.longitude], {
                icon: L.divIcon({ className: point.id === selected ? 'map-pin map-pin-selected' : 'map-pin', html: '<span aria-hidden="true">●</span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
                title: point.label, alt: point.label, keyboard: true,
            });
            const label = document.createElement('span');
            label.textContent = point.label;
            marker.bindTooltip(label);
            marker.on('click', () => callbacks.current.onSelect?.(point.id));
            marker.addTo(markers.current);
        }
        if (valid.length) map.current.fitBounds(L.latLngBounds(valid.map(point => [point.latitude, point.longitude])), { padding: [35, 35], maxZoom: 14, animate: false });
    }, [points, selected]);
    return <div className="space-y-2">
        <div ref={container} role="region" aria-label="Location map. Use arrow keys to pan and plus or minus to zoom." className="relative z-0 h-80 w-full rounded-2xl border border-gray-200" />
        {tileError && <p role="status" className="text-sm text-amber-800">Map tiles could not load. Check your internet connection; you can still use the list or coordinate fields.</p>}
        <a className="inline-block text-xs text-gray-600 underline" href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Report a map issue</a>
    </div>;
}
