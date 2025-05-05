'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import MaplibreDraw from 'maplibre-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RectangleMode } from './GeofenceMap';

interface MapComponentProps {
    onMapLoad: () => void;
    onDrawCreate: (e: any) => void;
    onDrawUpdate: (e: any) => void;
    onDrawDelete: (e: any) => void;
    mapRef: React.MutableRefObject<maplibregl.Map | null>;
    drawRef: React.MutableRefObject<MaplibreDraw | null>;
}

export const MapComponent = ({
    onMapLoad,
    onDrawCreate,
    onDrawUpdate,
    onDrawDelete,
    mapRef,
    drawRef,
}: MapComponentProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        mapRef.current = new maplibregl.Map({
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

        mapRef.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        drawRef.current = new MaplibreDraw({
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

        mapRef.current.addControl(drawRef.current as any, 'top-right');

        mapRef.current.on('load', onMapLoad);
        mapRef.current.on('draw.create', onDrawCreate);
        mapRef.current.on('draw.update', onDrawUpdate);
        mapRef.current.on('draw.delete', onDrawDelete);

        return () => {
            mapRef.current?.remove();
        };
    }, [onMapLoad, onDrawCreate, onDrawUpdate, onDrawDelete, mapRef, drawRef]);

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainer} className="h-full w-full" />
        </div>
    );
};
