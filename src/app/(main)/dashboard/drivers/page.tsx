'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDriverStore } from '@/store';
import { Driver, Frame, FrameRenderedComponentPropsWithIndex } from '@/utils/constants/types';
import RideLayout from '@/components/ui/RideLayout';
import NRCCarousel from '@/components/ui/NRCCarousel';
import DriverCard from '@/components/ui/DriverCard';
import { getDriver } from '@/lib/prisma/dbDriver';
import React from 'react';

// Stricter type for frames in map
type StrictFrame = {
    key: string;
    mobile: { component: (props: FrameRenderedComponentPropsWithIndex) => React.ReactElement };
    desktop: { component: (props: FrameRenderedComponentPropsWithIndex) => React.ReactElement };
};

const DriversPage = () => {
    const router = useRouter();
    const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();
    const [isLoading, setIsLoading] = useState(true);
    const [carouselFrames, setCarouselFrames] = useState<Frame[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const driverPromises = drivers.map(async (driver: Driver) => {
                    const driverData = await getDriver(driver.id);
                    if (!driverData) return null;
                    // Cast status to match DriverCardProps
                    const status = ['active', 'inactive', 'offline'].includes(driverData.status)
                        ? (driverData.status as 'active' | 'inactive' | 'offline')
                        : undefined;
                    return {
                        key: `driver-${driver.id}`,
                        mobile: {
                            component: (props: FrameRenderedComponentPropsWithIndex) => (
                                <DriverCard
                                    item={{
                                        id: driverData.id,
                                        title: `${driverData.firstName} ${driverData.lastName}`.trim(),
                                        profileImageUrl: driver.profileImageUrl || '/default-profile.png',
                                        busImageUrl: '/images/default-bus.jpg',
                                        licensePlate: driverData.bus?.licensePlate || 'N/A',
                                        capacity: driverData.bus?.capacity || 0,
                                        rating: driver.rating || 0,
                                        latitude: 0,
                                        longitude: 0,
                                        model: driverData.bus?.category,
                                        status,
                                    }}
                                    selected={selectedDriver ?? 0}
                                    setSelected={() => {
                                        setSelectedDriver(driverData.id);
                                        router.push(`/drivers/${driverData.id}`);
                                    }}
                                />
                            ),
                        },
                        desktop: {
                            component: (props: FrameRenderedComponentPropsWithIndex) => (
                                <DriverCard
                                    item={{
                                        id: driverData.id,
                                        title: `${driverData.firstName} ${driverData.lastName}`.trim(),
                                        profileImageUrl: driver.profileImageUrl || '/default-profile.png',
                                        busImageUrl: '/images/default-bus.jpg',
                                        licensePlate: driverData.bus?.licensePlate || 'N/A',
                                        capacity: driverData.bus?.capacity || 0,
                                        rating: driver.rating || 0,
                                        latitude: 0,
                                        longitude: 0,
                                        model: driverData.bus?.category,
                                        status,
                                    }}
                                    selected={selectedDriver ?? 0}
                                    setSelected={() => {
                                        setSelectedDriver(driverData.id);
                                        router.push(`/drivers/${driverData.id}`);
                                    }}
                                />
                            ),
                        },
                    } as StrictFrame;
                });

                const results = await Promise.all(driverPromises);
                const validFrames = results.filter((frame): frame is StrictFrame => frame !== null);
                setCarouselFrames(validFrames as Frame[]);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching driver data:', error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [drivers, selectedDriver, setSelectedDriver, router]);

    if (isLoading) {
        return (
            <RideLayout title="Choose a Driver">
                <p className="text-gray-500">Loading drivers...</p>
            </RideLayout>
        );
    }

    if (carouselFrames.length === 0) {
        return (
            <RideLayout title="Choose a Driver">
                <p className="text-red-500">No drivers available at the moment.</p>
            </RideLayout>
        );
    }

    return (
        <RideLayout title="Choose a Driver">
            <NRCCarousel
                frames={carouselFrames}
                breakpoint="lg"
                slideDuration={5000}
                noAutoPlay={false}
                heights={{ mobile: 300, desktop: 400 }}
                ariaLabel="Driver selection carousel"
                willAutoPlayOutsideViewport={false}
            />
        </RideLayout>
    );
};

export default DriversPage;
