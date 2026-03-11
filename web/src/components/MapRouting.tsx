'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

interface MapRoutingProps {
    start: [number, number];
    end: [number, number];
}

export default function MapRouting({ start, end }: MapRoutingProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        let routingControl: L.Routing.Control | null = null;

        try {
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(start[0], start[1]),
                    L.latLng(end[0], end[1])
                ],
                plan: L.Routing.plan([
                    L.latLng(start[0], start[1]),
                    L.latLng(end[0], end[1])
                ], {
                    createMarker: function () { return false; }
                }),
                lineOptions: {
                    styles: [{ color: '#3b82f6', weight: 4, opacity: 0.8 }],
                    extendToWaypoints: true,
                    missingRouteTolerance: 0
                },
                show: false,
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: true,
                showAlternatives: false
            })
                .on('routingerror', (e: any) => {
                    // Avoid noisy "{}" errors in console; show a clear message instead.
                    // This usually happens if the routing service is unreachable.
                    console.warn('Routing error while computing path', e?.error || e);
                })
                .addTo(map);
        } catch (e) {
            console.warn('Failed to initialize routing control', e);
        }

        return () => {
            if (routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, start, end]);

    return null;
}
