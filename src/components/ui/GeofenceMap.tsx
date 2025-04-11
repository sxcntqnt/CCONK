'use client';

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import GeofenceControls from './GeofenceControls';

interface Geofence {
    id: string;
    name: string;
    description?: string;
    geoJson: any;
    color: string;
    createdAt: Date;
}

const GeofenceMap = () => {
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [activeGeofence, setActiveGeofence] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const draw = useRef<MapboxDraw | null>(null);

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
            center: [51.505, -0.09],
            zoom: 13,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        // Initialize Mapbox Draw
        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: false,
                trash: false,
            },
        });
        map.current.addControl(draw.current, 'top-right');

        map.current.on('load', () => {
            setIsLoading(false);
        });

        // Drawing events
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

        geofences.forEach((g) => {
            if (map.current?.getLayer(g.id)) {
                map.current?.removeLayer(g.id);
            }
            if (map.current?.getSource(g.id)) {
                map.current?.removeSource(g.id);
            }
        });

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

            map.current?.on('click', geofzaamce.id, () => {
                setActiveGeofence(geofence.id);
            });
        });
    }, [geofences, activeGeofence, isLoading]);

    const startDrawing = (mode: 'draw_rectangle' | 'draw_polygon') => {
        if (draw.current && editMode) {
            draw.current.changeMode(mode);
        }
    };

    const handleNameChange = (id: string, name: string) => {
        setGeofences((prev) => prev.map((geofence) => (geofence.id === id ? { ...geofence, name } : geofence)));
    };

    const handleDeleteGeofence = (id: string) => {
        setGeofences((prev) => prev.filter((g) => g.id !== id));
        if (activeGeofence === id) {
            setActiveGeofence(null);
        }
        if (map.current?.getLayer(id)) {
            map.current?.removeLayer(id);
        }
        if (map.current?.getSource(id)) {
            map.current?.removeSource(id);
        }
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
