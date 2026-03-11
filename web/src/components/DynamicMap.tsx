'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Need to completely bypass SSR for Leaflet as it requires the window object
const MapComponent = dynamic(
    () => import('./Map'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full min-h-[500px] rounded-xl border border-[#262626] bg-[#171717] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 font-semibold tracking-widest text-sm uppercase">Loading Secure Map Protocol...</p>
                </div>
            </div>
        )
    }
);

interface DynamicMapProps {
    markers: Array<{
        id: string;
        lat: number;
        lng: number;
        title: string;
        description: string;
        isUrgent?: boolean;
        isOfficer?: boolean;
    }>;
    center?: [number, number];
    zoom?: number;
    routing?: {
        start: [number, number];
        end: [number, number];
    };
}

export default function DynamicMap(props: DynamicMapProps) {
    return <MapComponent {...props} />;
}
