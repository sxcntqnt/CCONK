'use client';

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MaplibreDraw, { DrawCustomMode, DrawCustomModeThis, MapMouseEvent } from 'maplibre-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-draw/dist/maplibre-gl-draw.css';
import GeofenceControls from './GeofenceControls';
import { GeoJSON } from 'geojson';

interface Geofence {
    id: string;
    name: string;
    description?: string;
    geoJson: any;
    color: string;
    createdAt: Date;
}

// Custom Rectangle Mode
interface RectangleModeState {
    startPoint: maplibregl.LngLat | null;
}

const RectangleMode: DrawCustomMode<RectangleModeState, any> = {
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
        const feature = {
            id: `geofence-${Date.now()}`,
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
            },
            properties: {},
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
    const [activeGeofence, setActiveGeofence] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MaplibreDraw | null>(null);

    const colorPalette = ['#FF5F6D', '#47B881', '#4299E1', '#FFC107', '#9F7AEA', '#ED64A6'];
    const getRandomColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];

    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'osm-tiles': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution:
                            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm-tiles',
                    },
                ],
            },
            center: [-1.36876, 36.33421],
            zoom: 13,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        draw.current = new MaplibreDraw({
            displayControlsDefault: false,
            controls: {
                polygon: false,
                trash: false,
            },
            modes: {
                ...MaplibreDraw.modes,
                draw_rectangle: RectangleMode,
            },
        });

        map.current.addControl(draw.current as any, 'top-right');

        map.current.on('load', () => {
            setIsLoading(false);
        });

        map.current.on('draw.create', (e) => {
            const id = `geofence-${Date.now()}`;
            const color = getRandomColor();
            const newGeofence: Geofence = {
                id,
                name: `Geofence ${geofences.length + 1}`,
                geoJson: e.features[0],
                color,
                createdAt: new Date(),
            };
            setGeofences((prev) => [...prev, newGeofence]);
            setActiveGeofence(id);
            draw.current?.changeMode('simple_select');
        });

        map.current.on('draw.update', (e) => {
            const updatedFeature = e.features[0];
            setGeofences((prev) =>
                prev.map((g) => (g.id === updatedFeature.id ? { ...g, geoJson: updatedFeature } : g)),
            );
        });

        map.current.on('draw.delete', (e) => {
            const deletedIds = e.features.map((f: any) => f.id);
            setGeofences((prev) => prev.filter((g) => !deletedIds.includes(g.id)));
            if (deletedIds.includes(activeGeofence)) setActiveGeofence(null);
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    useEffect(() => {
        if (!map.current || isLoading) return;

        // Remove old geofences
        geofences.forEach((g) => {
            if (map.current?.getLayer(g.id)) map.current.removeLayer(g.id);
            if (map.current?.getSource(g.id)) map.current.removeSource(g.id);
        });

        // Add updated geofences
        geofences.forEach((geofence) => {
            map.current?.addSource(geofence.id, {
                type: 'geojson',
                data: geofence.geoJson,
            });

            map.current?.addLayer({
                id: geofence.id,
                type: 'fill',
                source: geofence.id,
                paint: {
                    'fill-color': geofence.color,
                    'fill-opacity': activeGeofence === geofence.id ? 0.5 : 0.3,
                    'fill-outline-color': geofence.color,
                },
            });

            map.current?.on('click', geofence.id, () => {
                setActiveGeofence(geofence.id);
            });
        });
    }, [geofences, activeGeofence, isLoading]);

    const startDrawing = (mode: 'draw_rectangle' | 'draw_polygon') => {
        if (draw.current && editMode) {
            draw.current.changeMode(mode as any);
        }
    };

    const handleNameChange = (id: string, name: string) => {
        setGeofences((prev) => prev.map((geofence) => (geofence.id === id ? { ...geofence, name } : geofence)));
    };

    const handleDeleteGeofence = (id: string) => {
        setGeofences((prev) => prev.filter((g) => g.id !== id));
        if (activeGeofence === id) setActiveGeofence(null);
        if (map.current?.getLayer(id)) map.current.removeLayer(id);
        if (map.current?.getSource(id)) map.current.removeSource(id);
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
            <div className="w-full md:w-3/4 h-3/4 md:h-full relative">
                <div ref={mapContainer} className="h-full w-full" />
            </div>
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
