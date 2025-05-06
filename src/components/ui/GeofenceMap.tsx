'use client';

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MaplibreDraw, { DrawCustomMode, DrawCustomModeThis, MapMouseEvent } from 'maplibre-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import GeofenceControls from './GeofenceControls';
import { GeoJSON } from 'geojson';
import { MapComponent } from './MapComponent';
import { Owner, User, Geofence } from '@/utils/constants/types';

// Custom Rectangle Mode
interface RectangleModeState {
    startPoint: maplibregl.LngLat | null;
}

export const RectangleMode: DrawCustomMode<RectangleModeState, any> = {
    onSetup(this: DrawCustomModeThis, options: any): RectangleModeState {
        this.clearSelectedFeatures();
        this.setActionableState({ trash: true, combineFeatures: false, uncombineFeatures: false });
        return { startPoint: null };
    },
    onClick(this: DrawCustomModeThis, state: RectangleModeState, e: MapMouseEvent) {
        if (!state.startPoint) {
            state.startPoint = e.lngLat;
            return;
        }
        const endPoint = e.lngLat;
        const coordinates = [
            [state.startPoint.lng, state.startPoint.lat],
            [state.startPoint.lng, endPoint.lat],
            [endPoint.lng, endPoint.lat],
            [endPoint.lng, state.startPoint.lat],
            [state.startPoint.lng, state.startPoint.lat],
        ];
        const feature: GeoJSON = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
            },
            properties: {},
            id: Date.now(),
        };
        this.map.fire('draw.create', { features: [feature] });
        this.changeMode('simple_select');
    },
    toDisplayFeatures(
        this: DrawCustomModeThis,
        state: RectangleModeState,
        geojson: GeoJSON,
        display: (geojson: GeoJSON) => void,
    ) {
        display(geojson);
    },
};

const GeofenceMap = () => {
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [activeGeofence, setActiveGeofence] = useState<number | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MaplibreDraw | null>(null);

    const colorPalette = ['#FF5F6D', '#47B881', '#4299E1', '#FFC107', '#9F7AEA', '#ED64A6'];
    const getRandomColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const handleMapLoad = () => {
        setIsLoading(false);
    };

    const handleDrawCreate = (e: any) => {
        const id = Date.now();
        const color = getRandomColor();
        const newGeofence: Geofence = {
            id,
            name: `Geofence ${geofences.length + 1}`,
            h3Index: '',
            resolution: 8,
            geoJson: e.features[0],
            color,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setGeofences((prev) => [...prev, newGeofence]);
        setActiveGeofence(id);
        draw.current?.changeMode('simple_select');
    };

    const handleDrawUpdate = (e: any) => {
        const updatedFeature = e.features[0];
        setGeofences((prev) =>
            prev.map((geofence) =>
                geofence.id === updatedFeature.id
                    ? { ...geofence, geoJson: updatedFeature, updatedAt: new Date() }
                    : geofence,
            ),
        );
    };

    const handleDrawDelete = (e: any) => {
        const deletedIds = e.features.map((f: any) => f.id);
        setGeofences((prev) => prev.filter((geofence) => !deletedIds.includes(geofence.id)));
        if (deletedIds.includes(activeGeofence)) setActiveGeofence(null);
    };

    useEffect(() => {
        if (isLoading || !mapRef.current) return;

        const map = mapRef.current;

        // Remove old geofences
        geofences.forEach((geofence) => {
            const layerId = geofence.id.toString();
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(layerId)) map.removeSource(layerId);
        });

        // Add updated geofences
        geofences.forEach((geofence) => {
            const layerId = geofence.id.toString();
            map.addSource(layerId, {
                type: 'geojson',
                data: geofence.geoJson,
            });

            map.addLayer({
                id: layerId,
                type: 'fill',
                source: layerId,
                paint: {
                    'fill-color': geofence.color,
                    'fill-opacity': activeGeofence === geofence.id ? 0.5 : 0.3,
                    'fill-outline-color': geofence.color,
                },
            });

            map.on('click', layerId, () => {
                setActiveGeofence(geofence.id);
            });
        });

        return () => {
            geofences.forEach((geofence) => {
                const layerId = geofence.id.toString();
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(layerId)) map.removeSource(layerId);
            });
        };
    }, [geofences, activeGeofence, isLoading]);

    const startDrawing = (mode: 'draw_rectangle' | 'draw_polygon') => {
        if (draw.current && editMode) {
            draw.current.changeMode(mode as any);
        }
    };

    const handleNameChange = (id: number, name: string) => {
        setGeofences((prev) =>
            prev.map((geofence) => (geofence.id === id ? { ...geofence, name, updatedAt: new Date() } : geofence)),
        );
    };

    const handleDeleteGeofence = (id: number) => {
        setGeofences((prev) => prev.filter((geofence) => geofence.id !== id));
        if (activeGeofence === id) setActiveGeofence(null);
        const layerId = id.toString();
        if (mapRef.current?.getLayer(layerId)) mapRef.current.removeLayer(layerId);
        if (mapRef.current?.getSource(layerId)) mapRef.current.removeSource(layerId);
    };

    const filteredGeofences = geofences.filter((geofence) =>
        geofence.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full bg-background">
            <MapComponent
                onMapLoad={handleMapLoad}
                onDrawCreate={handleDrawCreate}
                onDrawUpdate={handleDrawUpdate}
                onDrawDelete={handleDrawDelete}
                mapRef={mapRef}
                drawRef={draw}
            />
            <GeofenceControls
                geofences={filteredGeofences}
                activeGeofence={activeGeofence}
                setActiveGeofence={setActiveGeofence}
                editMode={editMode}
                setEditMode={setEditMode}
                onNameChange={handleNameChange}
                onDelete={handleDeleteGeofence}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                startDrawing={startDrawing}
            />
        </div>
    );
};

export default GeofenceMap;
