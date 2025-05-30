'use server';

import { db } from '@/lib';
import {
    getTripIdForDriver,
    getUsersWithReservations,
    updateTripStatus,
    TripStatus,
    DriverStatus,
    ReservationStatus,
} from '@/utils';
import { Prisma } from '@/lib/prisma/client';

interface DriverData {
    id: number;
    userId: number;
    licenseNumber: string;
    status: string;
    firstName: string;
    lastName: string;
    email: string;
    bus?: {
        id: number;
        licensePlate: string;
        capacity: number;
        category: string;
    };
}

interface TripData {
    id: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime?: string;
    status: string;
    isFullyBooked: boolean;
    createdAt: string;
    updatedAt: string;
    bus: {
        id: number;
        licensePlate: string;
        capacity: number;
        category: string;
    };
}

interface NotificationData {
    id: number;
    tripId?: number;
    type: string;
    message: string;
    subject: string;
    status: string;
    createdAt: string;
    sentAt?: string;
    user: {
        id: number;
        email: string;
    };
}

// Fetch a driver by ID (for Dashboard, Vehicle)
export async function getDriver(driverId: number): Promise<DriverData | null> {
    try {
        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
                user: { select: { name: true, email: true } },
                bus: { select: { id: true, licensePlate: true, capacity: true, category: true } },
            },
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        return {
            id: driver.id,
            userId: driver.userId,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
            firstName: driver.user.name.split(' ')[0],
            lastName: driver.user.name.split(' ')[1] || '',
            email: driver.user.email,
            bus: driver.bus
                ? {
                      id: driver.bus.id,
                      licensePlate: driver.bus.licensePlate,
                      capacity: driver.bus.capacity,
                      category: driver.bus.category,
                  }
                : undefined,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriver error: ${errorMsg}`);
        throw new Error(`Failed to fetch driver: ${errorMsg}`);
    }
}

// Fetch active trips for a driver (for Dashboard)
export async function getActiveTrips({
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: number;
    page?: number;
    pageSize?: number;
    filters?: { departureCity?: string; arrivalCity?: string };
}): Promise<{ trips: TripData[]; total: number }> {
    try {
        const { departureCity, arrivalCity } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const trips = await db.trip.findMany({
            where: {
                driverId,
                status: { not: 'COMPLETED' },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
            },
            include: {
                bus: { select: { id: true, licensePlate: true, capacity: true, category: true } },
            },
            skip,
            take: pageSize,
            orderBy: { departureTime: 'asc' },
        });

        const total = await db.trip.count({
            where: {
                driverId,
                status: { not: 'COMPLETED' },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
            },
        });

        const formattedTrips: TripData[] = trips.map((trip) => ({
            id: trip.id,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
            status: trip.status,
            isFullyBooked: trip.isFullyBooked,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
            bus: {
                id: trip.bus.id,
                licensePlate: trip.bus.licensePlate,
                capacity: trip.bus.capacity,
                category: trip.bus.category,
            },
        }));

        return { trips: formattedTrips, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getActiveTrips error: ${errorMsg}`);
        throw new Error(`Failed to fetch trips: ${errorMsg}`);
    }
}

// Fetch notifications sent by a driver (for Reminder)
export async function getNotifications({
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: number;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}): Promise<{ notifications: NotificationData[]; total: number }> {
    try {
        const { type, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const notifications = await db.notification.findMany({
            where: {
                driverId,
                trip: { status: { not: 'COMPLETED' } },
                ...(type && { type }),
                ...(status && { status }),
            },
            include: {
                user: { select: { id: true, email: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        });

        const total = await db.notification.count({
            where: {
                driverId,
                trip: { status: { not: 'COMPLETED' } },
                ...(type && { type }),
                ...(status && { status }),
            },
        });

        const formattedNotifications: NotificationData[] = notifications.map((notification) => ({
            id: notification.id,
            tripId: notification.tripId ?? undefined,
            type: notification.type,
            message: notification.message,
            subject: notification.subject,
            status: notification.status,
            createdAt: notification.createdAt.toISOString(),
            sentAt: notification.sentAt?.toISOString(),
            user: {
                id: notification.user.id,
                email: notification.user.email,
            },
        }));

        return { notifications: formattedNotifications, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getNotifications error: ${errorMsg}`);
        throw new Error(`Failed to fetch notifications: ${errorMsg}`);
    }
}

// Update a trip's status and send notifications (for Dashboard)
export async function updateTripStatusAction({
    tripId,
    driverId,
    status,
    destination,
}: {
    tripId: number;
    driverId: number;
    status: string;
    destination?: string;
}): Promise<{ success: boolean }> {
    try {
        const tripResponse = await getTripIdForDriver(driverId);
        if (tripResponse.error || tripResponse.data !== tripId) {
            throw new Error('No active trip found for driver or trip ID mismatch');
        }

        // Map lowercase status to TripStatus
        const statusMap: { [key: string]: TripStatus } = {
            scheduled: TripStatus.SCHEDULED,
            in_progress: TripStatus.IN_PROGRESS,
            completed: TripStatus.COMPLETED,
            cancelled: TripStatus.CANCELLED,
        };

        const prismaStatus = statusMap[status.toLowerCase()];
        if (!prismaStatus) {
            throw new Error(`Invalid trip status: ${status}`);
        }

        const message =
            status === 'COMPLETED' && destination
                ? `Driver has arrived at ${destination}.`
                : `Trip status updated to ${status}.`;

        // Update trip status with mapped TripStatus
        const updateResponse = await updateTripStatus(tripId, prismaStatus);
        if (updateResponse.error) {
            throw new Error(updateResponse.error);
        }

        return { success: true };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`updateTripStatusAction error: ${errorMsg}`);
        throw new Error(`Failed to update trip status: ${errorMsg}`);
    }
}

// Ensure a driver has an active trip (for testing)
export async function ensureDriverHasTrip(driverId: number): Promise<void> {
    try {
        const tripResponse = await getTripIdForDriver(driverId);
        if (tripResponse.data) {
            return; // Driver already has an active trip
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: { bus: true },
        });
        if (!driver || !driver.bus) {
            throw new Error('Driver or bus not found');
        }

        await db.trip.create({
            data: {
                busId: driver.bus.id,
                driverId,
                departureCity: 'Nairobi',
                arrivalCity: 'Mombasa',
                departureTime: new Date(),
                status: 'SCHEDULED',
                isFullyBooked: false,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureDriverHasTrip error: ${errorMsg}`);
        throw new Error(`Failed to ensure driver has trip: ${errorMsg}`);
    }
}
