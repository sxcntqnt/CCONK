'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { images } from '@/utils/constants/icons';
import { getActiveTripsForDriver } from '@/utils/functions/driverUtils';
import { Trip } from '@/utils/constants/types';
import TripCard from '@/components/ui/TripCard';
import RideLayout from '@/components/ui/RideLayout';

const TripsPage = () => {
    const { user } = useUser();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        const fetchTrips = async () => {
            setLoading(true);
            // Mock driverId; replace with actual mapping from user.id
            const result = await getActiveTripsForDriver(1); // Example driverId
            if (result.error) {
                setError(result.error);
            } else {
                setTrips(result.data || []);
            }
            setLoading(false);
        };

        fetchTrips();
    }, [user?.id]);

    return (
        <RideLayout title="All Trips">
            <div className="px-5 pb-10">
                {loading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : trips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center">
                        <Image
                            src={images.noResult}
                            alt="No recent trips found"
                            width={160}
                            height={160}
                            className="w-40 h-40 object-contain"
                        />
                        <p className="text-sm text-gray-600">No recent trips found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                        ))}
                    </div>
                )}
            </div>
        </RideLayout>
    );
};

export default TripsPage;
