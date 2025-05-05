'use client';

import { useRouter } from 'next/navigation';
import { useDriverStore, useBusStore, MarkerData, mapDriverAndBusToMarkerData } from '@/store';
import { useState, useEffect } from 'react';
import DriverCard from '@/components/ui/DriverCard';
import RideLayout from '@/components/ui/RideLayout';
import { Driver } from '@/utils/constants/types';
import { getDriverAndBusMarkerData } from '@/utils/functions/driverUtils';

const DriversPage = () => {
    const router = useRouter();
    const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();
    const [isLoading, setIsLoading] = useState(true);
    const [markerData, setMarkerData] = useState<MarkerData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const markerDataPromises = drivers.map(async (driver: Driver) => {
                    if (!driver.busId) return null;
                    const result = await getDriverAndBusMarkerData(driver.id);
                    return result.data || null;
                });
                const results = await Promise.all(markerDataPromises);
                const validMarkerData = results.filter(
                    (marker: MarkerData | null): marker is MarkerData => marker !== null,
                );
                setMarkerData(validMarkerData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching marker data:', error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [drivers]);

    if (isLoading) {
        return (
            <RideLayout title="Choose a Driver">
                <p className="text-gray-500">Loading drivers...</p>
            </RideLayout>
        );
    }

    if (markerData.length === 0) {
        return (
            <RideLayout title="Choose a Driver">
                <p className="text-red-500">No drivers available at the moment.</p>
            </RideLayout>
        );
    }

    return (
        <RideLayout title="Choose a Driver">
            <div className="space-y-4">
                {markerData.map((marker) => (
                    <DriverCard
                        key={marker.id}
                        item={marker}
                        selected={selectedDriver ?? 0}
                        setSelected={() => {
                            setSelectedDriver(marker.id);
                            router.push(`/drivers/${marker.id}`);
                        }}
                    />
                ))}
            </div>
        </RideLayout>
    );
};

export default DriversPage;
