'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet when used with Webpack/Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A custom pulsing icon for active dispatch/incidents
const urgentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const officerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
    isUrgent?: boolean;
    isOfficer?: boolean;
}

interface MapProps {
    markers: MapMarker[];
    center?: [number, number];
    zoom?: number;
    routing?: {
        start: [number, number];
        end: [number, number];
    };
}

// Map Routing wrapper - draw a direct polyline between start and end.
// This avoids relying on external routing services that can fail and
// ensures the officer always sees a clear direction of travel.
function MapRouting({ start, end }: { start: [number, number]; end: [number, number] }) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useMap } = require('react-leaflet');
    const map = useMap();

    useEffect(() => {
        // Bail out if map or DOM container is not ready yet
        // (avoids "appendChild of undefined" errors during mount/unmount).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!map || !(map as any)._container || !start || !end) return;

        let line: L.Polyline | null = null;

        try {
            line = L.polyline(
                [
                    L.latLng(start[0], start[1]),
                    L.latLng(end[0], end[1])
                ],
                {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.9
                }
            ).addTo(map);

            // Fit the map to show both the unit and the incident
            map.fitBounds(line.getBounds(), { padding: [40, 40] });
        } catch (e) {
            console.warn('Failed to render route polyline', e);
        }

        return () => {
            if (line) {
                try {
                    map.removeLayer(line);
                } catch {
                    // ignore cleanup errors
                }
            }
        };
    }, [map, start[0], start[1], end[0], end[1]]);

    return null;
}

// Locate Me Control button
function LocateControl() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useMap } = require('react-leaflet');
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        
        const LocateButton = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                container.style.backgroundColor = '#171717';
                container.style.border = '2px solid rgba(0,0,0,0.2)';
                container.style.backgroundClip = 'padding-box';
                container.style.width = '30px';
                container.style.height = '30px';
                container.style.cursor = 'pointer';
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.title = 'Locate Me';
                
                // Base64 SVG for a crosshair target icon
                container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;

                container.onclick = function (e: Event) {
                    e.preventDefault();
                    e.stopPropagation();
                    map.locate({ setView: true, maxZoom: 16 });
                };

                return container;
            }
        });

        const lc = new LocateButton();
        map.addControl(lc);

        return () => {
            map.removeControl(lc);
        };
    }, [map]);

    // Handle the successful location find to put a marker down
    const [position, setPosition] = React.useState<L.LatLng | null>(null);
    useMapEvents({
        locationfound(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        locationerror(e) {
            console.warn("Locate Me error:", e.message);
            alert("Could not access your GPS location. Please check browser permissions or try again.");
        }
    });

    return position === null ? null : (
        <Marker position={position} icon={officerIcon} zIndexOffset={9999}>
            <Popup>
                <div className="p-1">
                    <h3 className="font-bold text-gray-800">Your Location</h3>
                    <p className="text-sm text-gray-600">GPS verified.</p>
                </div>
            </Popup>
        </Marker>
    );
}

export default function AppMap({ markers, center = [40.7128, -74.0060], zoom = 12, routing }: MapProps) {
    useEffect(() => {
        // Force map resize to fix tile loading issues in hidden tabs
        window.dispatchEvent(new Event('resize'));
    }, []);

    return (
        <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-2xl relative border border-[#262626] z-0">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full absolute inset-0">
                {/* Use a dark-themed tile layer (CartoDB Dark Matter) to match GuardianNet aesthetic */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.lat, marker.lng]}
                        icon={marker.isOfficer ? officerIcon : (marker.isUrgent ? urgentIcon : defaultIcon)}
                        zIndexOffset={marker.isOfficer ? 1000 : 0}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <h3 className="font-bold text-gray-800 mb-1">{marker.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{marker.description}</p>
                                {marker.isUrgent && (
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded">URGENT</span>
                                )}
                                {marker.isOfficer && (
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">PATROL UNIT</span>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocateControl />

                {routing && <MapRouting start={routing.start} end={routing.end} />}
            </MapContainer>
        </div>
    );
}
