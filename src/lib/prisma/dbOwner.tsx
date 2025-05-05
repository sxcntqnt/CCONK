'use server';

import { db } from '@/lib';
import { getUsersWithReservations } from '@/utils/functions/driverUtils';
import { Prisma } from '@/lib/prisma/client';
import { Owner, Bus, Driver, Reservation, Notification, Trip } from '@/utils/constants/types';

// Fetch an owner by ID (for Dashboard)
export async function getOwner(ownerId: number): Promise<Owner | null> {
    try {
        const owner = await db.owner.findUnique({
            where: { id: ownerId },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
                        email: true,
                        image: true, // Fetch image for profileImageUrl
                        role: true,
                    },
                },
            },
        });

        if (!owner) {
            throw new Error('Owner not found');
        }

        return {
            id: owner.id,
            userId: owner.userId,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt,
            profileImageUrl: owner.user.image, // Map user.image to profileImageUrl
            user: {
                id: owner.user.id,
                clerkId: owner.user.clerkId,
                name: owner.user.name,
                email: owner.user.email,
                image: owner.user.image,
                role: owner.user.role,
            },
            buses: [],
            geofences: [],
            incomeExpenses: [],
            reports: [],
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOwner error: ${errorMsg}`);
        throw new Error(`Failed to fetch owner: ${errorMsg}`);
    }
}

// Fetch buses owned by the owner (for Vehicle)
export async function getBuses({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { licensePlate?: string; capacity?: number };
}): Promise<{ buses: Bus[]; total: number }> {
    try {
        const { licensePlate, capacity } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const buses = await db.bus.findMany({
            where: {
                ownerId,
                ...(licensePlate && { licensePlate }),
                ...(capacity && { capacity }),
            },
            include: {
                images: { select: { src: true, blurDataURL: true, alt: true } },
            },
            skip,
            take: pageSize,
            orderBy: { id: 'asc' },
        });

        const total = await db.bus.count({
            where: {
                ownerId,
                ...(licensePlate && { licensePlate }),
                ...(capacity && { capacity }),
            },
        });

        const formattedBuses: Bus[] = buses.map((bus) => ({
            id: bus.id,
            licensePlate: bus.licensePlate,
            capacity: bus.capacity,
            model: bus.model ?? undefined,
            latitude: bus.latitude ?? undefined,
            longitude: bus.longitude ?? undefined,
            lastLocationUpdate: bus.lastLocationUpdate?.toISOString(),
            category: bus.category,
            images:
                bus.images.length > 0
                    ? bus.images.map((img) => ({
                          src: img.src,
                          blurDataURL: img.blurDataURL ?? undefined,
                          alt: img.alt,
                      }))
                    : [{ src: '/placeholder.jpg', blurDataURL: undefined, alt: 'Vehicle placeholder' }],
        }));

        return { buses: formattedBuses, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBuses error: ${errorMsg}`);
        throw new Error(`Failed to fetch buses: ${errorMsg}`);
    }
}

// Fetch drivers for the owner's buses (for Drivers)
export async function getDrivers({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { licenseNumber?: string };
}): Promise<{ drivers: Driver[]; total: number }> {
    try {
        const { licenseNumber } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const drivers = await db.driver.findMany({
            where: {
                bus: { ownerId },
                ...(licenseNumber && { licenseNumber }),
            },
            select: {
                id: true,
                busId: true,
                userId: true,
                licenseNumber: true,
                status: true,
                rating: true,
                profileImageUrl: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            skip,
            take: pageSize,
            orderBy: { id: 'asc' },
        });

        const total = await db.driver.count({
            where: {
                bus: { ownerId },
                ...(licenseNumber && { licenseNumber }),
            },
        });

        const formattedDrivers: Driver[] = drivers.map((driver) => ({
            id: driver.id,
            busId: driver.busId ?? undefined,
            userId: driver.userId,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
            firstName: driver.user.name.split(' ')[0],
            lastName: driver.user.name.split(' ')[1] || '',
            email: driver.user.email,
            profileImageUrl: driver.profileImageUrl, // Required, no ?? undefined
            rating: driver.rating ?? undefined,
        }));

        return { drivers: formattedDrivers, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDrivers error: ${errorMsg}`);
        throw new Error(`Failed to fetch drivers: ${errorMsg}`);
    }
}
// Fetch trips for the owner's buses (for Dashboard, Reservations)
export async function getTrips({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { departureCity?: string; arrivalCity?: string; status?: string };
}): Promise<{ trips: Trip[]; total: number }> {
    try {
        const { departureCity, arrivalCity, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const trips = await db.trip.findMany({
            where: {
                bus: { ownerId },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
                ...(status && { status }),
            },
            include: {
                driver: {
                    include: { user: { select: { name: true, email: true } } },
                },
                bus: { select: { id: true, licensePlate: true, capacity: true, category: true } },
            },
            skip,
            take: pageSize,
            orderBy: { departureTime: 'asc' },
        });

        const total = await db.trip.count({
            where: {
                bus: { ownerId },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
                ...(status && { status }),
            },
        });

        const formattedTrips: Trip[] = trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            driverId: trip.driverId ?? undefined,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
            status: trip.status,
            isFullyBooked: trip.isFullyBooked,
            originLatitude: trip.originLatitude ?? undefined,
            originLongitude: trip.originLongitude ?? undefined,
            destinationLatitude: trip.destinationLatitude ?? undefined,
            destinationLongitude: trip.destinationLongitude ?? undefined,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
            bus: {
                id: trip.bus.id,
                licensePlate: trip.bus.licensePlate,
                capacity: trip.bus.capacity,
                category: trip.bus.category,
                images: [],
            },
        }));

        return { trips: formattedTrips, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getTrips error: ${errorMsg}`);
        throw new Error(`Failed to fetch trips: ${errorMsg}`);
    }
}

// Fetch reservations for the owner's buses (for Reservations, Customer)
export async function getReservations({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { tripId?: number; status?: string };
}): Promise<{ reservations: (Reservation & { user: { id: number; name: string; email: string } })[]; total: number }> {
    try {
        const { tripId, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const reservations = await db.reservation.findMany({
            where: {
                trip: { bus: { ownerId } },
                ...(tripId && { tripId }),
                ...(status && { status }),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            skip,
            take: pageSize,
            orderBy: { bookedAt: 'desc' },
        });

        const total = await db.reservation.count({
            where: {
                trip: { bus: { ownerId } },
                ...(tripId && { tripId }),
                ...(status && { status }),
            },
        });

        const formattedReservations: (Reservation & { user: { id: number; name: string; email: string } })[] =
            reservations.map((reservation) => ({
                id: reservation.id,
                userId: reservation.userId,
                tripId: reservation.tripId,
                seatId: reservation.seatId,
                status: reservation.status,
                bookedAt: reservation.bookedAt.toISOString(),
                updatedAt: reservation.updatedAt.toISOString(),
                paymentId: reservation.paymentId ?? undefined,
                user: {
                    id: reservation.user.id,
                    name: reservation.user.name,
                    email: reservation.user.email,
                },
            }));

        return { reservations: formattedReservations, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getReservations error: ${errorMsg}`);
        throw new Error(`Failed to fetch reservations: ${errorMsg}`);
    }
}

// Fetch notifications for the owner's buses (for Reminder)
export async function getNotifications({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        const { type, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const notifications = await db.notification.findMany({
            where: {
                trip: { bus: { ownerId } },
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
                trip: { bus: { ownerId } },
                ...(type && { type }),
                ...(status && { status }),
            },
        });

        const formattedNotifications: Notification[] = notifications.map((notification) => ({
            id: notification.id,
            userId: notification.userId,
            tripId: notification.tripId ?? undefined,
            type: notification.type,
            message: notification.message,
            status: notification.status,
            createdAt: notification.createdAt.toISOString(),
            sentAt: notification.sentAt?.toISOString(),
            driverId: notification.driverId ?? undefined,
            subject: notification.subject,
        }));

        return { notifications: formattedNotifications, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getNotifications error: ${errorMsg}`);
        throw new Error(`Failed to fetch notifications: ${errorMsg}`);
    }
}

// Ensure a bus has an active trip (for testing)
export async function ensureBusHasTrip(busId: number): Promise<void> {
    try {
        const trip = await db.trip.findFirst({
            where: { busId, status: { not: 'completed' } },
        });

        if (trip) {
            return; // Bus already has an active trip
        }

        const bus = await db.bus.findUnique({
            where: { id: busId },
            include: { drivers: { take: 1 } },
        });
        if (!bus || !bus.drivers.length) {
            throw new Error('Bus or driver not found');
        }

        await db.trip.create({
            data: {
                busId,
                driverId: bus.drivers[0].id,
                departureCity: 'Nairobi',
                arrivalCity: 'Mombasa',
                departureTime: new Date(),
                status: 'scheduled',
                isFullyBooked: false,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusHasTrip error: ${errorMsg}`);
        throw new Error(`Failed to ensure bus has trip: ${errorMsg}`);
    }
}
