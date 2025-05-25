'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useTripStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrips } from '@/lib/prisma/dbTracking';

const TrackingPage = () => {
    const router = useRouter();
    const { trips, setTrips, setSelectedTrip } = useTripStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch trips
    const fetchTrips = async () => {
        try {
            // TODO: Replace with actual ownerId from Clerk authentication
            const ownerId = 1;
            const { trips: fetchedTrips } = await getTrips({ ownerId, page: 1, pageSize: 100 });
            setTrips(fetchedTrips);
            setError(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch trips';
            setError(errorMsg);
            console.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize data on mount
    useEffect(() => {
        fetchTrips();
    }, [setTrips]);

    // Handle trip click
    const handleTripClick = (tripId: number) => {
        setSelectedTrip(tripId);
        router.push(`/tracking/${tripId}`);
    };

    // Card animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.4,
                ease: [0.25, 0.8, 0.25, 1], // iOS-like easing
            },
        }),
    };

    // Loading/error animation variants
    const messageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <div className="h-screen bg-gray-900 text-white p-4 overflow-y-auto">
            <motion.h2
                className="text-2xl font-bold mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            >
                Trip Tracking
            </motion.h2>
            <AnimatePresence>
                {isLoading ? (
                    <motion.p
                        key="loading"
                        className="text-gray-400 animate-pulse"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        Loading trips...
                    </motion.p>
                ) : error ? (
                    <motion.div
                        key="error"
                        className="p-3 bg-red-500 text-white rounded-xl"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {error}
                    </motion.div>
                ) : trips.length === 0 ? (
                    <motion.p
                        key="empty"
                        className="text-gray-400"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        No trips available.
                    </motion.p>
                ) : (
                    <div className="space-y-4">
                        {trips.map((trip, index) => (
                            <motion.div
                                key={trip.id}
                                custom={index}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileTap={{ scale: 0.95 }} // iOS tap effect
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }} // Desktop hover
                                className="motion-safe:transition-transform motion-safe:duration-200"
                            >
                                <Card
                                    className="bg-gray-700 text-white cursor-pointer hover:bg-gray-600 shadow-lg rounded-xl"
                                    onClick={() => handleTripClick(trip.id)}
                                >
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
                                            <strong>Status:</strong> {trip.status}
                                        </p>
                                        <p>
                                            <strong>Capacity:</strong> {trip.bus.capacity}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrackingPage;
