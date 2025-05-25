'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import MaplibreDraw from 'maplibre-gl-draw';
import { motion, AnimatePresence } from 'motion/react';
import { MapComponent } from '@/components/ui/MapComponent';
import { useTripStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrips, getTrackingRecords } from '@/lib/prisma/dbTracking';
import { Trip, Tracking } from '@/utils/constants/types';

const TripDetailsPage = () => {
    const params = useParams();
    const tripId = parseInt(params.id as string, 10);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<MaplibreDraw | null>(null);
    const { trips, setSelectedTrip } = useTripStore();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [trackingRecords, setTrackingRecords] = useState<Tracking[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch trip and tracking data
    const fetchData = async () => {
        try {
            // TODO: Replace with actual ownerId from Clerk authentication
            const ownerId = 1;

            // Fetch trip
            // TODO: Update dbTracking.tsx to support filtering by trip ID
            const { trips: fetchedTrips } = await getTrips({
                ownerId,
                page: 1,
                pageSize: 100 /*, filters: { id: tripId }*/,
            });
            const selectedTrip = fetchedTrips.find((t) => t.id === tripId);
            if (!selectedTrip) throw new Error('Trip not found');
            setTrip(selectedTrip);
            setSelectedTrip(tripId);

            // Fetch tracking records for the trip's bus
            const { trackingRecords } = await getTrackingRecords({
                ownerId,
                page: 1,
                pageSize: 1000,
                filters: { busId: selectedTrip.busId },
            });
            setTrackingRecords(trackingRecords);

            setError(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch trip data';
            setError(errorMsg);
            console.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tripId]);

    // Handle map load and draw polyline
    const handleMapLoad = () => {
        if (!mapRef.current || trackingRecords.length === 0) return;

        // Create polyline from tracking records
        const coordinates: [number, number][] = trackingRecords
            .filter((record) => record.latitude && record.longitude)
            .map((record) => [record.longitude, record.latitude] as [number, number]);

        if (coordinates.length > 0) {
            mapRef.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates,
                    },
                },
            });

            mapRef.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#22c55e',
                    'line-width': 4,
                },
            });

            // Fit map to bounds
            const bounds = coordinates.reduce(
                (bounds, coord) => {
                    return bounds.extend(coord as [number, number]);
                },
                new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
            );
            mapRef.current.fitBounds(bounds, { padding: 50 });
        }
    };

    // MapComponent callbacks (no drawing needed)
    const onDrawCreate = () => {};
    const onDrawUpdate = () => {};
    const onDrawDelete = () => {};

    // Animation variants
    const sidebarVariants = {
        hidden: { x: '100%', opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: [0.25, 0.8, 0.25, 1] },
        },
        exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } },
    };

    const mapVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: [0.25, 0.8, 0.25, 1] },
        },
    };

    const messageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <AnimatePresence>
                {isLoading ? (
                    <motion.div
                        key="loading"
                        className="flex-1 p-4"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <p className="text-gray-400 animate-pulse">Loading trip details...</p>
                    </motion.div>
                ) : error || !trip ? (
                    <motion.div
                        key="error"
                        className="flex-1 p-4"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="p-3 bg-red-500 text-white rounded-xl">{error || 'Trip not found'}</div>
                    </motion.div>
                ) : (
                    <>
                        {/* Map Container */}
                        <motion.div className="flex-1 h-full" variants={mapVariants} initial="hidden" animate="visible">
                            <MapComponent
                                mapRef={mapRef}
                                drawRef={drawRef}
                                onMapLoad={handleMapLoad}
                                onDrawCreate={onDrawCreate}
                                onDrawUpdate={onDrawUpdate}
                                onDrawDelete={onDrawDelete}
                            />
                        </motion.div>

                        {/* Sidebar for Trip Details */}
                        <motion.div
                            className="w-80 p-4 bg-gray-800 border-l border-gray-700 overflow-y-auto"
                            variants={sidebarVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <h2 className="text-2xl font-bold mb-4">Trip Details</h2>
                            <Card className="bg-gray-700 text-white shadow-lg rounded-xl">
                                <CardHeader>
                                    <CardTitle>
                                        {trip.departureCity} to {trip.arrivalCity}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>
                                        <strong>Bus:</strong> {trip.bus.licensePlate}
                                    </p>
                                    <p>
                                        <strong>Departure:</strong> {new Date(trip.departureTime).toLocaleString()}
                                    </p>
                                    <p>
                                        <strong>Arrival:</strong>{' '}
                                        {trip.arrivalTime ? new Date(trip.arrivalTime).toLocaleString() : 'N/A'}
                                    </p>
                                    <p>
                                        <strong>Status:</strong> {trip.status}
                                    </p>
                                    <p>
                                        <strong>Capacity:</strong> {trip.bus.capacity}
                                    </p>
                                    <p>
                                        <strong>Tracking Points:</strong> {trackingRecords.length}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TripDetailsPage;
