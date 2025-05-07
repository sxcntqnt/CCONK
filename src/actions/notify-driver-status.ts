'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { Knock } from '@knocklabs/node';
import { db } from '@/lib';
import { ROLES } from '@/utils/constants/roles';
import { Notification } from '@/utils/constants/types';

// Types
interface Recipient {
    id: string;
    name: string;
    email: string;
    userId?: number; // Add numeric userId
}

interface NotificationData {
    busId?: string;
    tripId?: string;
    status: string;
    driverName: string;
    message?: string;
}

// Knock instance
const knock = new Knock(process.env.KNOCK_API_SECRET!);

// Helper: Get authenticated driver and verify role
async function getAuthenticatedDriver() {
    const user = await currentUser();
    if (!user) throw new Error('User not authenticated');

    const driver = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { driver: true },
    });

    if (
        !driver ||
        (driver.role !== ROLES.DRIVER && driver.role !== ROLES.OWNER) ||
        (!driver.driver && driver.role === ROLES.DRIVER)
    ) {
        throw new Error('Authenticated user is not authorized to send notifications');
    }

    return { clerkUser: user, prismaDriver: driver };
}

// Helper: Validate form data
function validateFormData(formData: FormData): { message?: string } {
    const messageRaw = formData.get('message');
    const message = messageRaw && typeof messageRaw === 'string' ? validateMessage(messageRaw) : undefined;
    return { message };
}

// Helper: Validate and sanitize message
function validateMessage(message: string): string {
    const trimmed = message.trim().substring(0, 500);
    if (trimmed.length === 0) return '';
    const sanitized = trimmed.replace(/[^a-zA-Z0-9\s,.-?!]/g, '');
    return sanitized;
}

// Helper: Fetch the driver's active trip (for In-Transit)
async function fetchDriverTrip(driverId: number) {
    const trip = await db.trip.findFirst({
        where: {
            driverId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: { bus: true },
        orderBy: { departureTime: 'desc' },
    });

    return trip;
}

// Helper: Fetch passengers from reservations (for In-Transit)
async function fetchPassengers(tripId: number): Promise<Recipient[]> {
    const reservations = await db.reservation.findMany({
        where: { tripId, status: 'CONFIRMED' },
        include: { user: { select: { id: true, clerkId: true, name: true, email: true } } },
    });

    return reservations.map((reservation) => {
        const user = reservation.user;
        const fallbackId = `passenger_${reservation.id}`;
        const fallbackName = `Passenger ${reservation.seatId}`;
        const fallbackEmail = 'passenger@example.com';

        return {
            id: user?.clerkId || fallbackId,
            name: user?.name || fallbackName,
            email: user?.email || fallbackEmail,
            userId: user?.id || 0,
        };
    });
}

// Helper: Fetch owner recipients (for Offline)
async function fetchOwners(): Promise<Recipient[]> {
    const owners = await db.user.findMany({
        where: { role: ROLES.OWNER },
        select: { id: true, clerkId: true, name: true, email: true },
    });

    return owners.map((owner) => ({
        id: owner.clerkId,
        name: owner.name || 'Owner',
        email: owner.email || 'owner@example.com',
        userId: owner.id,
    }));
}

// Helper: Send and persist notification
async function sendStatusNotification(
    driver: { clerkUser: any; prismaDriver: any },
    status: string,
    trip: any,
    message: string | undefined,
    recipients: Recipient[],
): Promise<Notification> {
    const notificationData: NotificationData = {
        busId: trip?.busId?.toString(),
        tripId: trip?.id?.toString(),
        status,
        driverName: driver.clerkUser.firstName || 'Driver',
        message,
    };

    const driverRecipient: Recipient = {
        id: driver.clerkUser.id,
        name: driver.clerkUser.firstName || 'Driver',
        email:
            driver.clerkUser.emailAddresses.find((email: any) => email.id === driver.clerkUser.primaryEmailAddressId)
                ?.emailAddress || 'driver@example.com',
        userId: driver.prismaDriver.id,
    };

    // Send via Knock
    await knock.workflows.trigger(`driver-${status}`, {
        data: notificationData,
        recipients: [...recipients, driverRecipient],
    });

    // Persist notification in Prisma and return the first created notification
    const notifications = await db.notification.createMany({
        data: [...recipients, driverRecipient].map((recipient) => ({
            userId: recipient.userId || 0,
            tripId: trip?.id,
            type: `DRIVER_${status.toUpperCase()}`,
            message: message || `${notificationData.driverName} is now ${status}.`,
            status: 'sent',
            driverId: driver.prismaDriver.driver?.id,
            sentAt: new Date(),
            createdAt: new Date(),
            subject: `Driver ${status.charAt(0).toUpperCase() + status.slice(1)} Notification`,
        })),
    });

    // Fetch the first created notification (for the driver)
    const createdNotification = await db.notification.findFirst({
        where: {
            userId: driverRecipient.userId,
            type: `DRIVER_${status.toUpperCase()}`,
            sentAt: { gte: new Date(Date.now() - 1000) },
        },
    });

    if (!createdNotification) {
        throw new Error('Failed to retrieve created notification');
    }

    // Update trip status for In-Transit
    if (status === 'in-transit' && trip) {
        await db.trip.update({
            where: { id: trip.id },
            data: { status: 'IN_PROGRESS' },
        });
    }

    return {
        id: createdNotification.id,
        userId: createdNotification.userId,
        tripId: createdNotification.tripId,
        type: createdNotification.type,
        message: createdNotification.message,
        status: createdNotification.status,
        createdAt: createdNotification.createdAt,
        sentAt: createdNotification.sentAt,
        driverId: createdNotification.driverId,
        subject: createdNotification.subject,
    };
}

/**
 * Notify relevant users when the driver goes offline
 */
export async function notifyDriverOffline(formData: FormData): Promise<Notification> {
    try {
        const driver = await getAuthenticatedDriver();
        const { message } = validateFormData(formData);
        const recipients = await fetchOwners();

        const notification = await sendStatusNotification(driver, 'offline', null, message, recipients);
        revalidatePath('/drivers');
        return notification;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify offline status: ${message}`);
    }
}

/**
 * Notify passengers when the driver is in-transit
 */
export async function notifyDriverInTransit(formData: FormData): Promise<Notification> {
    try {
        const driver = await getAuthenticatedDriver();
        const { message } = validateFormData(formData);
        const trip = await fetchDriverTrip(driver.prismaDriver.driver!.id);
        if (!trip) throw new Error('No active trip found for this driver');
        const recipients = await fetchPassengers(trip.id);

        const notification = await sendStatusNotification(driver, 'in-transit', trip, message, recipients);
        revalidatePath('/drivers');
        return notification;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify in-transit status: ${message}`);
    }
}
