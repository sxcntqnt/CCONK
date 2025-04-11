'use client';

import React from 'react';
import dynamic from 'next/dynamic';

export default function Geofence() {
    const MapWithNoSSR = dynamic(() => import('@/components/ui/GeofenceMap'), {
        ssr: false,
    });

    return (
        <main>
            <div className="w-full h-screen" id="map">
                <GeofenceMap />
            </div>
        </main>
    );
}
