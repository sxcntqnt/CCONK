'use client';

import { useRouter } from 'next/navigation';
import { useDriverStore, useBusStore, useReservationStore, mapDriverAndBusToMarkerData, MarkerData } from '@/store';
import Image from 'next/image';
import { formatTimeOfDay, fetchAPI } from '@/lib/names';
import { useEffect, useState, useCallback } from 'react';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';
import { notifyDriverOffline, notifyDriverInTransit } from '@/actions/notify-driver-status';
import ProgressLoader from '@/components/ui/progressbar';

// Custom Hooks
const useDriverDetails = (driverId: string) => {
    const { drivers, selectedDriver } = useDriverStore();
    const { buses } = useBusStore();

    const driver = drivers.find((driver) => driver.id === parseInt(driverId));
    const bus = driver?.busId ? buses.find((bus) => bus.id === driver.busId) : undefined;
    const driverDetails: MarkerData =
        driver && bus
            ? mapDriverAndBusToMarkerData(driver, bus)
            : {
                  id: 0,
                  title: 'Select a Driver',
                  profileImageUrl: '/default-profile.png',
                  busImageUrl: '/images/default-bus.jpg',
                  licensePlate: 'N/A',
                  capacity: 0,
                  rating: 0,
                  latitude: 0,
                  longitude: 0,
              };

    return { driverDetails, isValidDriver: selectedDriver === parseInt(driverId) };
};

const useProgress = (capacity: number, reservationCount: number) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (capacity > 0) {
            const calculatedProgress = (reservationCount / capacity) * 100;
            setProgress(Math.min(Math.max(calculatedProgress, 0), 100));
        } else {
            setProgress(0);
        }
    }, [reservationCount, capacity]);

    return progress;
};

const useNotifications = (driverTitle: string) => {
    const notify = useCallback(
        async (status: string, destination?: string) => {
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.warn('Notification permission denied');
                    return;
                }
            }

            const notificationBody =
                status === 'arrived' ? `Driver has ${status} at ${destination}.` : `Driver is now ${status}.`;

            new Notification('Driver Status Update', {
                body: notificationBody,
                icon: '/icons/notification.png',
            });

            const formData = new FormData();
            formData.append(
                'message',
                status === 'arrived' && destination
                    ? `Driver ${driverTitle} has arrived at ${destination}.`
                    : `Driver ${driverTitle} is now ${status}.`,
            );
            if (status === 'arrived' && destination) {
                formData.append('destination', destination);
            }

            try {
                const notifyFn = {
                    offline: notifyDriverOffline,
                    'in-transit': notifyDriverInTransit,
                    arrived: notifyDriverArrival,
                }[status];
                if (notifyFn) {
                    await notifyFn(formData);
                    console.log(`Server-side ${status} notification sent successfully`);
                }
            } catch (error) {
                console.error(`Failed to send ${status} notification:`, error);
                new Notification('Notification Error', {
                    body: `Failed to send ${status} notification. Please try again.`,
                });
            }
        },
        [driverTitle],
    );

    return notify;
};

// Components
const RideLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {children}
    </div>
);

const CustomButton: React.FC<{
    title: string;
    onPress: () => void;
    disabled?: boolean;
    isActive?: boolean;
}> = ({ title, onPress, disabled, isActive }) => (
    <button
        className={`flex-1 py-3 text-white rounded-lg transition-colors ${
            disabled ? 'bg-gray-400 cursor-not-allowed' : isActive ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={onPress}
        disabled={disabled}
        aria-pressed={isActive}
    >
        {title}
    </button>
);

const DriverProfile: React.FC<{ driverDetails: MarkerData }> = ({ driverDetails }) => (
    <div className="flex flex-col items-center justify-center mt-10">
        <Image
            src={driverDetails.profileImageUrl}
            alt="Driver Profile"
            width={112}
            height={112}
            className="rounded-full"
        />
        <div className="flex flex-row items-center justify-center mt-5 space-x-2">
            <span className="text-lg font-semibold">{driverDetails.title}</span>
            <div className="flex flex-row items-center space-x-0.5">
                <Image src="/icons/star.png" alt="Rating Star" width={20} height={20} className="inline-block" />
                <span className="text-lg">{driverDetails.rating}</span>
            </div>
        </div>
    </div>
);

const RideDetails: React.FC<{ capacity: number }> = ({ capacity }) => (
    <div className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-gray-100 mt-5">
        <div className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <span className="text-lg">Ride Price</span>
            <span className="text-lg text-green-500">$0</span>
        </div>
        <div className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <span className="text-lg">Pickup Time</span>
            <span className="text-lg">{formatTimeOfDay(new Date().toISOString())}</span>
        </div>
        <div className="flex flex-row items-center justify-between w-full py-3">
            <span className="text-lg">Car seats</span>
            <span className="text-lg">{capacity}</span>
        </div>
    </div>
);

const AddressSection: React.FC<{ userAddress: string; destinationAddress: string }> = ({
    userAddress,
    destinationAddress,
}) => (
    <div className="flex flex-col w-full items-start justify-center mt-5">
        <div className="flex flex-row items-center justify-start mt-3 border-t border-b border-gray-300 w-full py-3">
            <Image src="/icons/to.png" alt="Pickup Icon" width={24} height={24} />
            <span className="text-lg ml-2">{userAddress}</span>
        </div>
        <div className="flex flex-row items-center justify-start border-b border-gray-300 w-full py-3">
            <Image src="/icons/point.png" alt="Destination Icon" width={24} height={24} />
            <span className="text-lg ml-2">{destinationAddress}</span>
        </div>
    </div>
);

const BusOccupancy: React.FC<{ progress: number; reservationCount: number; capacity: number }> = ({
    progress,
    reservationCount,
    capacity,
}) => (
    <div className="mt-5">
        <h2 className="text-lg font-semibold mb-2">Bus Occupancy</h2>
        <ProgressLoader
            progress={progress}
            height="12px"
            barColor="bg-gray-200"
            fillColor="bg-green-600"
            className="w-full"
        />
        <p className="text-sm text-gray-600 mt-1">
            {reservationCount} of {capacity} seats reserved ({Math.round(progress)}%)
        </p>
    </div>
);

const DriverDetails = ({ driverId }: { driverId: string }) => {
    const router = useRouter();
    const { setActiveStatus, activeStatus } = useDriverStore();
    const { reservationCount } = useReservationStore();
    const { driverDetails, isValidDriver } = useDriverDetails(driverId);
    const progress = useProgress(driverDetails.capacity, reservationCount);
    const notify = useNotifications(driverDetails.title);

    const userAddress = '123 Pickup St, City';
    const destinationAddress = '456 Dropoff Ave, City';

    const handleStatusChange = async (status: string, route: string) => {
        setActiveStatus(status);
        router.push(route);
        await notify(status, status === 'arrived' ? destinationAddress : undefined);

        try {
            await fetchAPI('/api/status-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    driverId,
                    destination: status === 'arrived' ? destinationAddress : undefined,
                }),
            });
        } catch (error) {
            console.error('Failed to send status update:', error);
        }
    };

    if (!isValidDriver) {
        return (
            <RideLayout title="Driver Details">
                <p className="text-red-500">No driver selected.</p>
            </RideLayout>
        );
    }

    return (
        <RideLayout title="Driver Details">
            <div className="space-y-6">
                <DriverProfile driverDetails={driverDetails} />
                <RideDetails capacity={driverDetails.capacity} />
                <AddressSection userAddress={userAddress} destinationAddress={destinationAddress} />
                <BusOccupancy
                    progress={progress}
                    reservationCount={reservationCount}
                    capacity={driverDetails.capacity}
                />
                <div className="mt-10 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    <CustomButton
                        title="Offline"
                        onPress={() => handleStatusChange('offline', '/offline')}
                        disabled={activeStatus !== null && activeStatus !== 'offline'}
                        isActive={activeStatus === 'offline'}
                    />
                    <CustomButton
                        title="In-Transit"
                        onPress={() => handleStatusChange('in-transit', '/in-transit')}
                        disabled={activeStatus !== null && activeStatus !== 'in-transit'}
                        isActive={activeStatus === 'in-transit'}
                    />
                    <CustomButton
                        title="Arrived at Destination"
                        onPress={() => handleStatusChange('arrived', '/arrived-at-destination')}
                        disabled={activeStatus !== null && activeStatus !== 'arrived'}
                        isActive={activeStatus === 'arrived'}
                    />
                </div>
            </div>
        </RideLayout>
    );
};

export default DriverDetails;
