import { db } from '@/lib/prisma';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';
import { ROLES, Driver, Bus, Trip, ApiResponse, TripStatus } from '@/utils';

import { getDriverById, getBusByDriverId } from './driverUtils';

// Define MarkerData type locally to match usage in this file
export type MarkerData = {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    profileImageUrl: string;
    busImageUrl: string;
    licensePlate: string;
    capacity: number;
    rating: number;
    model?: string;
    status: 'ACTIVE' | 'OFFLINE';
};

export const mapDriverAndBusToMarkerData = (driver: Driver, bus: Bus): MarkerData => ({
    id: bus.id,
    latitude: bus.latitude || 0,
    longitude: bus.longitude || 0,
    title: `${driver.firstName} ${driver.lastName}`,
    profileImageUrl: driver.profileImageUrl || '/images/default-profile.jpg',
    busImageUrl: bus.images?.[0]?.src || '/images/default-bus.jpg',
    licensePlate: bus.licensePlate,
    capacity: bus.capacity,
    rating: driver.rating || 4.5,
    model: bus.model,
    status: driver.status,
});

export const getDriverAndBusMarkerData = async (driverId: number): Promise<ApiResponse<MarkerData>> => {
    try {
        const driverResponse = await getDriverById(driverId);
        const busResponse = await getBusByDriverId(driverId);

        if (driverResponse.error || busResponse.error) {
            return { error: driverResponse.error || busResponse.error, status: 404 };
        }

        const markerData = mapDriverAndBusToMarkerData(driverResponse.data!, busResponse.data!);
        return { data: markerData, status: 200 };
    } catch (error) {
        console.error('Error fetching marker data:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const handleArrival = async (tripId: number): Promise<ApiResponse<Trip>> => {
    try {
        const trip = await db.trip.findUnique({
            where: { id: tripId },
        });

        if (!trip) {
            return { error: 'Trip not found', status: 404 };
        }

        if (trip.status !== 'IN_PROGRESS' && trip.status !== 'SCHEDULED') {
            return { error: 'Trip is not active', status: 400 };
        }

        const updatedTrip = await db.trip.update({
            where: { id: tripId },
            data: {
                status: 'COMPLETED',
                arrivalTime: new Date(),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                busId: true,
                driverId: true,
                departureCity: true,
                arrivalCity: true,
                departureTime: true,
                arrivalTime: true,
                status: true,
                isFullyBooked: true,
                originLatitude: true,
                originLongitude: true,
                destinationLatitude: true,
                destinationLongitude: true,
                createdAt: true,
                updatedAt: true,
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        images: true,
                    },
                },
            },
        });

        const formattedTrip: Trip = {
            id: updatedTrip.id,
            busId: updatedTrip.busId,
            driverId: updatedTrip.driverId || undefined,
            departureCity: updatedTrip.departureCity,
            arrivalCity: updatedTrip.arrivalCity,
            departureTime: updatedTrip.departureTime.toISOString(),
            arrivalTime: updatedTrip.arrivalTime?.toISOString(),
            status: updatedTrip.status.toLowerCase() as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
            isFullyBooked: updatedTrip.isFullyBooked,
            originLatitude: updatedTrip.originLatitude || undefined,
            originLongitude: updatedTrip.originLongitude || undefined,
            destinationLatitude: updatedTrip.destinationLatitude || undefined,
            destinationLongitude: updatedTrip.destinationLongitude || undefined,
            createdAt: updatedTrip.createdAt.toISOString(),
            updatedAt: updatedTrip.updatedAt.toISOString(),
            bus: {
                id: updatedTrip.bus.id,
                licensePlate: updatedTrip.bus.licensePlate,
                capacity: updatedTrip.bus.capacity,
                category: updatedTrip.bus.category,
                images: updatedTrip.bus.images.map((img) => ({
                    id: img.id,
                    busId: img.busId,
                    src: img.src,
                    blurDataURL: img.blurDataURL || undefined,
                    alt: img.alt,
                })),
            },
        };

        const formData = new FormData();
        formData.append('tripId', tripId.toString());
        await notifyDriverArrival(formData);

        return { data: formattedTrip, status: 200 };
    } catch (error) {
        console.error('Error handling arrival:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
