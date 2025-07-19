'use server';

import { db } from '@/lib/prisma';
import { Knock } from '@knocklabs/node';
import { z } from 'zod';
import { Prisma, NotificationStatus } from '@prisma/client';
import { NotificationWithRelations } from './dbTypes';
import { Notification, Role, Trip } from '@/utils';

// Types
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

// Environment Variables
const KNOCK_API_SECRET = process.env.KNOCK_API_SECRET;
if (!KNOCK_API_SECRET) {
    throw new Error('KNOCK_API_SECRET is not set in environment variables');
}

// Initialize Knock instance
const knock = new Knock(KNOCK_API_SECRET);

// Validation Schemas
const schemas = {
    pagination: z.object({
        page: z.number().int().min(1, 'Page must be a positive integer').default(1),
        pageSize: z
            .number()
            .int()
            .min(1, 'PageSize must be a positive integer')
            .max(100, 'PageSize cannot exceed 100')
            .default(10),
    }),
    filter: z.object({
        type: z.string().optional(),
        status: z.string().optional(),
    }),
    notificationInput: z.object({
        destination: z
            .string()
            .min(2, 'Destination must be at least 2 characters')
            .max(100, 'Destination cannot exceed 100 characters')
            .optional(),
        message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
    }),
    updateNotification: z.object({
        message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
        status: z.enum(['pending', 'sent', 'read']).optional(),
        subject: z.string().max(100, 'Subject cannot exceed 100 characters').optional(),
    }),
    clerkId: z.string().min(1, 'Invalid clerk ID'),
    notificationId: z.string().min(1, 'Invalid notification ID'),
};

// Custom Error
class NotificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotificationError';
    }
}

// Utility Functions
function handleError(error: unknown, context: string): never {
    const errorMsg =
        error instanceof z.ZodError
            ? error.errors.map((e) => e.message).join(', ')
            : error instanceof Error
              ? error.message
              : String(error);
    console.error(`${context} error: ${errorMsg}`);
    throw new NotificationError(`Failed to ${context}: ${errorMsg}`);
}

const notificationInclude: Prisma.NotificationInclude = {
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
};

function formatNotification(notification: NotificationWithRelations): Notification {
    return {
        id: notification.id,
        userId: notification.userId,
        tripId: notification.tripId ?? undefined,
        type: notification.type,
        message: notification.message,
        subject: notification.subject,
        status: notification.status,
        createdAt: notification.createdAt,
        sentAt: notification.sentAt,
        driverId: notification.driverId ?? undefined,
        user: {
            id: notification.user.id,
            email: notification.user.email,
            clerkId: notification.user.clerkId,
            name: notification.user.name,
            image: notification.user.image,
            role: notification.user.role,
            phoneNumber: notification.user.phoneNumber,
            createdAt: notification.user.createdAt,
            updatedAt: notification.user.updatedAt,
        },
    };
}

async function checkAuthorization(
    clerkId: string,
    roleRequired: Role | Role[],
    notification?: { trip?: { bus: { ownerId: string } }; driverId?: string },
    driverId?: string,
    ownerId?: string,
): Promise<{ user: any; driver?: any; owner?: any }> {
    const user = await db.user.findUnique({ where: { clerkId }, include: { driver: true, owner: true } });
    if (!user) throw new NotificationError('User not found');

    const roles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!roles.includes(user.role)) throw new NotificationError('User is not authorized');

    if (user.role === Role.DRIVER && !user.driver) throw new NotificationError('User is not a driver');
    if (notification) {
        if (
            user.role === Role.OWNER &&
            (!notification.trip?.bus.ownerId || notification.trip.bus.ownerId !== user.owner?.id)
        ) {
            throw new NotificationError('User does not own this notification');
        }
        if (user.role === Role.DRIVER && (!notification.driverId || notification.driverId !== user.driver?.id)) {
            throw new NotificationError('User is not authorized for this notification');
        }
    }
    if (driverId && user.role === Role.DRIVER && user.driver?.id !== driverId) {
        throw new NotificationError('User is not the driver for this trip');
    }
    if (ownerId && user.role === Role.OWNER && user.owner?.id !== ownerId) {
        throw new NotificationError('User does not own this resource');
    }

    return { user, driver: user.driver, owner: user.owner };
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
            route: { select: { pickup_point: true, destinations: true } },
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
        include: { user: { select: { id: true, clerkId: true, name: true, email: true, role: true } } },
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

async function sendKnockNotification(status: string, data: NotificationData, recipients: Recipient[]): Promise<void> {
    try {
        await knock.workflows.trigger(`driver-${status}`, { data, recipients });
    } catch (error) {
        handleError(error, `send ${status} notification via Knock`);
    }
}

async function createDbNotifications(
    recipients: Recipient[],
    driverId: string | undefined,
    tripId: string | undefined,
    type: string,
    message: string,
    subject: string,
): Promise<NotificationWithRelations> {
    try {
        await db.notification.createMany({
            data: recipients.map((recipient) => ({
                userId: recipient.userId || '',
                tripId,
                type,
                message,
                status: 'sent' as NotificationStatus,
                driverId,
                sentAt: new Date(),
                createdAt: new Date(),
                subject,
            })),
        });

        const createdNotification = await db.notification.findFirst({
            where: {
                userId: recipients.find((r) => r.id === driverId)?.userId,
                type,
                sentAt: { gte: new Date(Date.now() - 1000) },
            },
            include: notificationInclude,
        });

        if (!createdNotification) throw new NotificationError('Failed to retrieve created notification');
        return createdNotification;
    } catch (error) {
        handleError(error, 'create database notifications');
    }
}

async function updateTripStatus(trip: Trip | null, status: 'arrival' | 'in-transit'): Promise<void> {
    if (!trip) return;
    try {
        const newStatus = status === 'arrival' ? 'COMPLETED' : 'IN_PROGRESS';
        await db.trip.update({ where: { id: trip.id }, data: { status: newStatus, updatedAt: new Date() } });
    } catch (error) {
        handleError(error, `update trip status to ${status}`);
    }
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

    await sendKnockNotification(status, notificationData, [...recipients, driverRecipient]);
    const createdNotification = await createDbNotifications(
        [...recipients, driverRecipient],
        driver.prismaDriver.driver?.id,
        trip?.id,
        notificationType,
        messageContent,
        subject,
    );
    await updateTripStatus(trip, status);

    return formatNotification(createdNotification);
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
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        await checkAuthorization(ownerId, Role.OWNER, undefined, undefined, ownerId);
        return fetchNotifications({ trip: { bus: { ownerId } } }, { page, pageSize }, filters);
    } catch (error) {
        handleError(error, 'getNotifications');
    }
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
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        await checkAuthorization(driverId, Role.DRIVER, undefined, driverId);
        return fetchNotifications({ driverId, trip: { status: { not: 'COMPLETED' } } }, { page, pageSize }, filters);
    } catch (error) {
        handleError(error, 'getDriverNotifications');
    }
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
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        const { user } = await checkAuthorization(clerkId, [Role.DRIVER, Role.OWNER, Role.PASSENGER]);
        return fetchNotifications({ userId: user.id }, { page, pageSize }, filters);
    } catch (error) {
        handleError(error, 'getUserNotifications');
    }
}

export async function notifyDriverArrival(
    clerkId: string,
    destination: string,
    message?: string,
): Promise<Notification> {
    try {
        const validatedData = schemas.notificationInput.parse({ destination, message });
        const driver = await checkAuthorization(clerkId, Role.DRIVER);
        const trip = await fetchDriverTrip(driver.driver!.id);
        const recipients = await fetchPassengers(trip.id);
        return sendNotification(
            {
                clerkUser: {
                    id: clerkId,
                    firstName: driver.user.name?.split(' ')[0] || 'Driver',
                    emailAddresses: [{ id: driver.user.id, emailAddress: driver.user.email }],
                    primaryEmailAddressId: driver.user.id,
                },
                prismaDriver: driver,
            },
            'arrival',
            trip,
            validatedData.destination,
            validatedData.message,
            recipients,
        );
    } catch (error) {
        handleError(error, 'notifyDriverArrival');
    }
}

export async function notifyDriverOffline(clerkId: string, message?: string): Promise<Notification> {
    try {
        const validatedData = schemas.notificationInput.parse({ message });
        const driver = await checkAuthorization(clerkId, Role.DRIVER);
        const recipients = await fetchOwners();
        return sendNotification(
            {
                clerkUser: {
                    id: clerkId,
                    firstName: driver.user.name?.split(' ')[0] || 'Driver',
                    emailAddresses: [{ id: driver.user.id, emailAddress: driver.user.email }],
                    primaryEmailAddressId: driver.user.id,
                },
                prismaDriver: driver,
            },
            'offline',
            null,
            undefined,
            validatedData.message,
            recipients,
        );
    } catch (error) {
        handleError(error, 'notifyDriverOffline');
    }
}

export async function notifyDriverInTransit(clerkId: string, message?: string): Promise<Notification> {
    try {
        const validatedData = schemas.notificationInput.parse({ message });
        const driver = await checkAuthorization(clerkId, Role.DRIVER);
        const trip = await fetchDriverTrip(driver.driver!.id);
        const recipients = await fetchPassengers(trip.id);
        return sendNotification(
            {
                clerkUser: {
                    id: clerkId,
                    firstName: driver.user.name?.split(' ')[0] || 'Driver',
                    emailAddresses: [{ id: driver.user.id, emailAddress: driver.user.email }],
                    primaryEmailAddressId: driver.user.id,
                },
                prismaDriver: driver,
            },
            'in-transit',
            trip,
            undefined,
            validatedData.message,
            recipients,
        );
    } catch (error) {
        handleError(error, 'notifyDriverInTransit');
    }
}

export async function updateNotification(
    clerkId: string,
    notificationId: string,
    data: { message?: string; status?: 'pending' | 'sent' | 'read'; subject?: string },
): Promise<Notification> {
    try {
        const validatedData = schemas.updateNotification.parse(data);
        const notification = await db.notification.findUnique({
            where: { id: notificationId },
            include: { trip: { include: { bus: { select: { ownerId: true } } } }, driver: { select: { id: true } } },
        });
        if (!notification) throw new NotificationError('Notification not found');

        const { user } = await checkAuthorization(clerkId, [Role.DRIVER, Role.OWNER], notification);

        const updatedNotification = await db.notification.update({
            where: { id: notificationId },
            data: {
                message: validatedData.message ?? undefined,
                status: validatedData.status ?? undefined,
                subject: validatedData.subject ?? undefined,
            },
            include: notificationInclude,
        });

        return formatNotification(updatedNotification);
    } catch (error) {
        handleError(error, 'updateNotification');
    }
}

export async function deleteNotification(clerkId: string, notificationId: string): Promise<void> {
    try {
        const notification = await db.notification.findUnique({
            where: { id: notificationId },
            include: { trip: { include: { bus: { select: { ownerId: true } } } }, driver: { select: { id: true } } },
        });
        if (!notification) throw new NotificationError('Notification not found');

        await checkAuthorization(clerkId, [Role.DRIVER, Role.OWNER], notification);
        await db.notification.delete({ where: { id: notificationId } });
    } catch (error) {
        handleError(error, 'deleteNotification');
    }
}
