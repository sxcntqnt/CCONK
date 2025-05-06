'use client';
import React from 'react';
import dynamic from 'next/dynamic';
const MapWithNoSSR = dynamic(() => import('@/components/ui/GeofenceMap'), {
    ssr: false,
    loading: () => (<div className="w-full h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        </div>),
});
export default function Geofence() {
    return (<main>
            <div className="w-full h-screen" id="map">
                <MapWithNoSSR />
            </div>
        </main>);
}
