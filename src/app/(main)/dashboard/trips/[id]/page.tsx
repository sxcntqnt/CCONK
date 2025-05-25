'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TripCard from '@/components/ui/TripCard';
import RideLayout from '@/components/ui/RideLayout';
import { Trip } from '@/utils/constants/types';
import { getActiveTripsForDriver } from '@/utils/functions/driverUtils';

const TripDetailsPage = () => {
    const { id } = useParams();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrip = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch trips for a driver (replace driverId with actual logic to get driver ID)
                const driverId = 1; // TODO: Replace with dynamic driver ID (e.g., from auth or store)
                const result = await getActiveTripsForDriver(driverId);

                if (result.error) {
                    setError(result.error);
                    return;
                }

                const foundTrip = result.data?.find((t: Trip) => t.id === Number(id));
                if (foundTrip) {
                    setTrip(foundTrip);
                } else {
                    setError('Trip not found');
                }
            } catch (err) {
                setError('Failed to fetch trip details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTrip();
        } else {
            setError('Invalid trip ID');
            setLoading(false);
        }
    }, [id]);

    return (
        <RideLayout title={`Trip ${id}`}>
            <div className="px-5 pb-10">
                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : trip ? (
                    <TripCard trip={trip} />
                ) : (
                    <p className="text-gray-600 text-center">No trip data available</p>
                )}
            </div>
        </RideLayout>
    );
};

export default TripDetailsPage;
