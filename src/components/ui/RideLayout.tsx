'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MaplibreDraw from 'maplibre-gl-draw';
import { aeonik } from '@/utils/constants/fonts';
import { icons } from '@/utils/constants/icons';
import { MapComponent as Map } from './MapComponent';

const RideLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const router = useRouter();
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<MaplibreDraw | null>(null);

    // Event handlers for MapComponent
    const handleMapLoad = () => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Center map on a default location or trip data
        // Assuming Trip has startLat, startLng; adjust based on actual Trip type
        const tripCenter = [-1.36876, 36.33421]; // Default (replace with trip.startLng, trip.startLat if available)
        map.setCenter(tripCenter as [number, number]);
        map.setZoom(13);

        // Example: Add marker for trip start point (extend with actual trip data)
        // new maplibregl.Marker()
        //   .setLngLat([trip.startLng, trip.startLat])
        //   .addTo(map);
        // Add end point marker or route if needed
    };
    const handleDrawCreate = (e: any) => {
        // No-op; geofence drawing not used in trip details
    };
    const handleDrawUpdate = (e: any) => {
        // No-op; geofence drawing not used in trip details
    };
    const handleDrawDelete = (e: any) => {
        // No-op; geofence drawing not used in trip details
    };

    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 ${aeonik.variable}`}>
            <div className="relative flex flex-col bg-blue-500">
                <div className="flex flex-row items-center justify-start px-5 py-4 absolute z-10 top-12">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
                        aria-label="Go back"
                    >
                        <Image src={icons.backArrow} alt="Back arrow" width={24} height={24} className="w-6 h-6" />
                    </button>
                    <span className="text-xl font-aeonik-semibold ml-4 text-white">{title || 'Go Back'}</span>
                </div>
                <Map
                    onMapLoad={handleMapLoad}
                    onDrawCreate={handleDrawCreate}
                    onDrawUpdate={handleDrawUpdate}
                    onDrawDelete={handleDrawDelete}
                    mapRef={mapRef}
                    drawRef={drawRef}
                />
            </div>

            <div className="flex-1 max-w-4xl mx-auto p-6 bg-white rounded-t-2xl shadow-md mt-[-20px] z-20">
                {children}
            </div>
        </div>
    );
};

export default RideLayout;
