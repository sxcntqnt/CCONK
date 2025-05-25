'use server';

import { db } from '@/lib/prisma';
import { Knock } from '@knocklabs/node';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { NotificationWithRelations } from './dbTypes';
import { Notification, Role, Trip } from '@/utils';

// Initialize Knock instance
const knock = new Knock(process.env.KNOCK_API_SECRET!);

interface Recipient {
    id: string;
    name: string;
    email: string;
    userId?: string;
}

interface NotificationData {
    busId?: string;
    tripId?: string;
    status: string;
    driverName: string;
    message?: string;
    destination?: string;
    licensePlate?: string;
}

// Validation Schemas
const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
});

const filterSchema = z.object({
    type: z.string().optional(),
    status: z.string().optional(),
});

const notificationInputSchema = z.object({
    destination: z.string().min(2).max(100).optional(),
    message: z.string().max(500).optional(),
});

const updateNotificationSchema = z.object({
    message: z.string().max(500).optional(),
    status: z.enum(['pending', 'sent', 'read']).optional(),
    subject: z.string().max(100).optional(),
});

// Custom Error
class NotificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotificationError';
    }
}

// Common Notification Fetcher
async function fetchNotifications<T extends Prisma.NotificationWhereInput>(
    whereClause: T,
    pagination: { page: number; pageSize: number },
    filters: { type?: string; status?: string },
): Promise<{ notifications: Notification[]; total: number }> {
    const { page, pageSize } = paginationSchema.parse(pagination);
    const { type, status } = filterSchema.parse(filters);
    const skip = (page - 1) * pageSize;

    if (!Number.isFinite(skip) || skip < 0) {
        throw new NotificationError(`Invalid pagination: page=${page}, pageSize=${pageSize}`);
    }

    try {
        const where: Prisma.NotificationWhereInput = {
            ...whereClause,
            ...(type && { type }),
            ...(status && { status }),
        };

        const [notifications, total] = await Promise.all([
            db.notification.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            clerkId: true,
                            name: true,
                            image: true,
                            role: true,
                            phoneNumber: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.notification.count({
                where,
            }),
        ]);

        return {
            notifications: notifications.map((n) => ({
                id: n.id,
                userId: n.userId,
                tripId: n.tripId ?? undefined,
                type: n.type,
                message: n.message,
                subject: n.subject,
                status: n.status,
                createdAt: n.createdAt,
                sentAt: n.sentAt,
                driverId: n.driverId ?? undefined,
                user: {
                    id: n.user.id,
                    email: n.user.email,
                    clerkId: n.user.clerkId,
                    name: n.user.name,
                    image: n.user.image,
                    role: n.user.role,
                    phoneNumber: n.user.phoneNumber,
                    createdAt: n.user.createdAt,
                    updatedAt: n.user.updatedAt,
                },
            })),
            total,
        };
    } catch (error) {
        throw new NotificationError(
            `Failed to fetch notifications: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

// Public API Functions
export async function getNotifications({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}) {
    return fetchNotifications({ trip: { bus: { ownerId } } }, { page, pageSize }, filters);
}

export async function getDriverNotifications({
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: string;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}) {
    return fetchNotifications({ driverId, trip: { status: { not: 'COMPLETED' } } }, { page, pageSize }, filters);
}

export async function getUserNotifications({
    clerkId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    clerkId: string;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}) {
    try {
        const user = await db.user.findUnique({
            where: { clerkId },
            select: { id: true },
        });

        if (!user) {
            throw new NotificationError('User not found');
        }

        return fetchNotifications({ userId: user.id }, { page, pageSize }, filters);
    } catch (error) {
        throw new NotificationError(
            `Failed to fetch user notifications: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export async function notifyDriverArrival(
    clerkId: string,
    destination: string,
    message?: string,
): Promise<Notification> {
    const { destination: sanitizedDestination, message: sanitizedMessage } = notificationInputSchema.parse({
        destination,
        message,
    });
    const driver = await getAuthenticatedDriver(clerkId);
    const trip = await fetchDriverTrip(driver.prismaDriver.driver!.id);
    const recipients = await fetchPassengers(trip.id);

    return sendNotification(driver, 'arrival', trip, sanitizedDestination, sanitizedMessage, recipients);
}

export async function notifyDriverOffline(clerkId: string, message?: string): Promise<Notification> {
    const { message: sanitizedMessage } = notificationInputSchema.parse({ message });
    const driver = await getAuthenticatedDriver(clerkId);
    const recipients = await fetchOwners();

    return sendNotification(driver, 'offline', null, undefined, sanitizedMessage, recipients);
}

export async function notifyDriverInTransit(clerkId: string, message?: string): Promise<Notification> {
    const { message: sanitizedMessage } = notificationInputSchema.parse({ message });
    const driver = await getAuthenticatedDriver(clerkId);
    const trip = await fetchDriverTrip(driver.prismaDriver.driver!.id);
    const recipients = await fetchPassengers(trip.id);

    return sendNotification(driver, 'in-transit', trip, undefined, sanitizedMessage, recipients);
}

export async function updateNotification(
    clerkId: string,
    notificationId: string,
    data: {
        message?: string;
        status?: 'pending' | 'sent' | 'read';
        subject?: string;
    },
): Promise<Notification> {
    const { message, status, subject } = updateNotificationSchema.parse(data);

    try {
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true, owner: true },
        });

        if (!user || (user.role !== Role.DRIVER && user.role !== Role.OWNER)) {
            throw new NotificationError('User is not authorized to update notifications');
        }

        const notification = await db.notification.findUnique({
            where: { id: notificationId },
            include: {
                trip: {
                    include: {
                        bus: { select: { ownerId: true } },
                    },
                },
                driver: { select: { id: true } },
            },
        });

        if (!notification) {
            throw new NotificationError('Notification not found');
        }

        if (
            (user.role === Role.OWNER &&
                (!notification.trip?.bus.ownerId || notification.trip.bus.ownerId !== user.owner?.id)) ||
            (user.role === Role.DRIVER && (!notification.driverId || notification.driverId !== user.driver?.id))
        ) {
            throw new NotificationError('User is not authorized to update this notification');
        }

        const updatedNotification = await db.notification.update({
            where: { id: notificationId },
            data: {
                message: message ?? undefined,
                status: status ?? undefined,
                subject: subject ?? undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        clerkId: true,
                        name: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return {
            id: updatedNotification.id,
            userId: updatedNotification.userId,
            tripId: updatedNotification.tripId ?? undefined,
            type: updatedNotification.type,
            message: updatedNotification.message,
            subject: updatedNotification.subject,
            status: updatedNotification.status,
            createdAt: updatedNotification.createdAt,
            sentAt: updatedNotification.sentAt,
            driverId: updatedNotification.driverId ?? undefined,
            user: {
                id: updatedNotification.user.id,
                email: updatedNotification.user.email,
                clerkId: updatedNotification.user.clerkId,
                name: updatedNotification.user.name,
                image: updatedNotification.user.image,
                role: updatedNotification.user.role,
                phoneNumber: updatedNotification.user.phoneNumber,
                createdAt: updatedNotification.user.createdAt,
                updatedAt: updatedNotification.user.updatedAt,
            },
        };
    } catch (error) {
        throw new NotificationError(
            `Failed to update notification: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export async function deleteNotification(clerkId: string, notificationId: string): Promise<void> {
    try {
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true, owner: true },
        });

        if (!user || (user.role !== Role.DRIVER && user.role !== Role.OWNER)) {
            throw new NotificationError('User is not authorized to delete notifications');
        }

        const notification = await db.notification.findUnique({
            where: { id: notificationId },
            include: {
                trip: {
                    include: {
                        bus: { select: { ownerId: true } },
                    },
                },
                driver: { select: { id: true } },
            },
        });

        if (!notification) {
            throw new NotificationError('Notification not found');
        }

        if (
            (user.role === Role.OWNER &&
                (!notification.trip?.bus.ownerId || notification.trip.bus.ownerId !== user.owner?.id)) ||
            (user.role === Role.DRIVER && (!notification.driverId || notification.driverId !== user.driver?.id))
        ) {
            throw new NotificationError('User is not authorized to delete this notification');
        }

        await db.notification.delete({
            where: { id: notificationId },
        });
    } catch (error) {
        throw new NotificationError(
            `Failed to delete notification: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

// Helper Functions
async function getAuthenticatedDriver(clerkId: string): Promise<{
    clerkUser: {
        id: string;
        firstName: string;
        emailAddresses: { id: string; emailAddress: string }[];
        primaryEmailAddressId: string;
    };
    prismaDriver: { id: string; role: Role; driver?: { id: string } };
}> {
    const driver = await db.user.findUnique({
        where: { clerkId },
        include: { driver: true },
    });

    if (
        !driver ||
        (driver.role !== Role.DRIVER && driver.role !== Role.OWNER) ||
        (!driver.driver && driver.role === Role.DRIVER)
    ) {
        throw new NotificationError('Authenticated user is not authorized to send notifications');
    }

    return {
        clerkUser: {
            id: clerkId,
            firstName: driver.name?.split(' ')[0] || 'Driver',
            emailAddresses: [{ id: driver.id, emailAddress: driver.email }],
            primaryEmailAddressId: driver.id,
        },
        prismaDriver: {
            id: driver.id,
            role: driver.role,
            driver: driver.driver ? { id: driver.driver.id } : undefined,
        },
    };
}

async function fetchDriverTrip(driverId: string): Promise<Trip> {
    const trip = await db.trip.findFirst({
        where: { driverId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, arrivalTime: null },
        include: {
            bus: {
                select: {
                    id: true,
                    licensePlate: true,
                    capacity: true,
                    category: true,
                    images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                },
            },
            route: {
                select: {
                    pickup_point: true,
                    destinations: true,
                },
            },
        },
        orderBy: { departureTime: 'desc' },
    });

    if (!trip) throw new NotificationError('No active trip found for this driver');

    const pickupPoint = trip.route.pickup_point as {
        pickup_point: string;
        pickup_latlng: { latitude: number; longitude: number };
    };
    const destination =
        (trip.route.destinations[trip.destinationIndex] as {
            destination: string;
            destination_latlng: { latitude: number; longitude: number };
        }) || {};

    return {
        id: trip.id,
        busId: trip.busId,
        driverId: trip.driverId ?? undefined,
        routeId: trip.routeId,
        destinationIndex: trip.destinationIndex,
        departureCity: pickupPoint.pickup_point,
        arrivalCity: destination.destination,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        isFullyBooked: trip.isFullyBooked,
        originLatitude: pickupPoint.pickup_latlng?.latitude,
        originLongitude: pickupPoint.pickup_latlng?.longitude,
        destinationLatitude: destination.destination_latlng?.latitude,
        destinationLongitude: destination.destination_latlng?.longitude,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        bus: {
            id: trip.bus.id,
            licensePlate: trip.bus.licensePlate,
            capacity: trip.bus.capacity,
            category: trip.bus.category,
            images: trip.bus.images.map((img) => ({
                id: img.id,
                busId: img.busId,
                src: img.src,
                blurDataURL: img.blurDataURL ?? undefined,
                alt: img.alt,
            })),
        },
    };
}

async function fetchPassengers(tripId: string): Promise<Recipient[]> {
    const reservations = await db.reservation.findMany({
        where: { tripId, status: 'CONFIRMED' },
        include: {
            user: {
                select: {
                    id: true,
                    clerkId: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    if (!reservations.length) throw new NotificationError('No confirmed passengers found for this trip');

    return reservations
        .filter((r) => r.user)
        .map((r) => ({
            id: r.user!.clerkId,
            name: r.user!.name || `Passenger ${r.seatId}`,
            email: r.user!.email || 'passenger@example.com',
            userId: r.user!.id,
        }));
}

async function fetchOwners(): Promise<Recipient[]> {
    const owners = await db.user.findMany({
        where: { role: Role.OWNER },
        select: { id: true, clerkId: true, name: true, email: true },
    });

    return owners.map((owner) => ({
        id: owner.clerkId,
        name: owner.name || 'Owner',
        email: owner.email || 'owner@example.com',
        userId: owner.id,
    }));
}

async function sendNotification(
    driver: {
        clerkUser: {
            id: string;
            firstName: string;
            emailAddresses: { id: string; emailAddress: string }[];
            primaryEmailAddressId: string;
        };
        prismaDriver: { id: string; role: Role; driver?: { id: string } };
    },
    status: 'arrival' | 'offline' | 'in-transit',
    trip: Trip | null,
    destination: string | undefined,
    message: string | undefined,
    recipients: Recipient[],
): Promise<Notification> {
    const driverRecipient: Recipient = {
        id: driver.clerkUser.id,
        name: driver.clerkUser.firstName || 'Driver',
        email:
            driver.clerkUser.emailAddresses.find((e) => e.id === driver.clerkUser.primaryEmailAddressId)
                ?.emailAddress || 'driver@example.com',
        userId: driver.prismaDriver.id,
    };

    const notificationData: NotificationData = {
        busId: trip?.busId,
        tripId: trip?.id,
        status: status === 'arrival' && destination ? `arrived at ${destination}` : status,
        driverName: driver.clerkUser.firstName || 'Driver',
        message,
        destination: status === 'arrival' ? destination : undefined,
        licensePlate: status === 'arrival' && trip ? trip.bus.licensePlate : undefined,
    };

    const notificationType = `DRIVER_${status.toUpperCase()}`;
    const subject = `Driver ${status.charAt(0).toUpperCase() + status.slice(1)} Notification`;
    const messageContent =
        message ||
        `${notificationData.driverName} is ${notificationData.status}${status === 'arrival' && trip ? ` with bus ${trip.bus.licensePlate}` : ''}.`;

    try {
        await knock.workflows.trigger(`driver-${status}`, {
            data: notificationData,
            recipients: [...recipients, driverRecipient],
        });

        await db.notification.createMany({
            data: [...recipients, driverRecipient].map((recipient) => ({
                userId: recipient.userId || '',
                tripId: trip?.id,
                type: notificationType,
                message: messageContent,
                status: 'sent',
                driverId: driver.prismaDriver.driver?.id,
                sentAt: new Date(),
                createdAt: new Date(),
                subject,
            })),
        });

        const createdNotification = await db.notification.findFirst({
            where: {
                userId: driverRecipient.userId,
                type: notificationType,
                sentAt: { gte: new Date(Date.now() - 1000) },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        clerkId: true,
                        name: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!createdNotification) {
            throw new NotificationError('Failed to retrieve created notification');
        }

        if (status === 'arrival' && trip) {
            await db.trip.update({
                where: { id: trip.id },
                data: { status: 'COMPLETED', updatedAt: new Date() },
            });
        } else if (status === 'in-transit' && trip) {
            await db.trip.update({
                where: { id: trip.id },
                data: { status: 'IN_PROGRESS', updatedAt: new Date() },
            });
        }

        return {
            id: createdNotification.id,
            userId: createdNotification.userId,
            tripId: createdNotification.tripId ?? undefined,
            type: createdNotification.type,
            message: createdNotification.message,
            subject: createdNotification.subject,
            status: createdNotification.status,
            createdAt: createdNotification.createdAt,
            sentAt: createdNotification.sentAt,
            driverId: createdNotification.driverId ?? undefined,
            user: {
                id: createdNotification.user.id,
                email: createdNotification.user.email,
                clerkId: createdNotification.user.clerkId,
                name: createdNotification.user.name,
                image: createdNotification.user.image,
                role: createdNotification.user.role,
                phoneNumber: createdNotification.user.phoneNumber,
                createdAt: createdNotification.user.createdAt,
                updatedAt: createdNotification.user.updatedAt,
            },
        };
    } catch (error) {
        throw new NotificationError(
            `Failed to send ${status} notification: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
