'use server';
import { revalidatePath } from 'next/cache';
import { currentUser } from '../../src/clerk/nextjs/server.mjs';
import { Knock } from '../../src/knocklabs/node.mjs';
import { db } from '../../src/lib/index.mjs';
import { ROLES } from '../../src/utils/constants/roles.mjs';
// Knock instance
const knock = new Knock(process.env.KNOCK_API_SECRET);
// Helper: Get authenticated driver and verify role
async function getAuthenticatedDriver() {
    const user = await currentUser();
    if (!user)
        throw new Error('User not authenticated');
    const driver = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { driver: true },
    });
    if (!driver ||
        (driver.role !== ROLES.DRIVER && driver.role !== ROLES.OWNER) ||
        (!driver.driver && driver.role === ROLES.DRIVER)) {
        throw new Error('Authenticated user is not authorized to send notifications');
    }
    return { clerkUser: user, prismaDriver: driver };
}
// Helper: Validate form data
function validateFormData(formData) {
    const messageRaw = formData.get('message');
    const message = messageRaw && typeof messageRaw === 'string' ? validateMessage(messageRaw) : undefined;
    return { message };
}
// Helper: Validate and sanitize message
function validateMessage(message) {
    const trimmed = message.trim().substring(0, 500);
    if (trimmed.length === 0)
        return '';
    const sanitized = trimmed.replace(/[^a-zA-Z0-9\s,.-?!]/g, '');
    return sanitized;
}
// Helper: Fetch the driver's active trip (for In-Transit)
async function fetchDriverTrip(driverId) {
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
async function fetchPassengers(tripId) {
    const reservations = await db.reservation.findMany({
        where: { tripId, status: 'CONFIRMED' },
        include: { user: { select: { clerkId: true, name: true, email: true } } },
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
        };
    });
}
// Helper: Fetch owner recipients (for Offline)
async function fetchowners() {
    const owners = await db.user.findMany({
        where: { role: ROLES.OWNER },
        select: { clerkId: true, name: true, email: true },
    });
    return owners.map((owner) => ({
        id: owner.clerkId,
        name: owner.name || 'owner',
        email: owner.email || 'owner@example.com',
    }));
}
// Helper: Send and persist notification
async function sendStatusNotification(driver, status, trip, message, recipients) {
    const notificationData = {
        busId: trip?.busId?.toString(),
        tripId: trip?.id?.toString(),
        status,
        driverName: driver.clerkUser.firstName || 'Driver',
        message,
    };
    const driverRecipient = {
        id: driver.clerkUser.id,
        name: driver.clerkUser.firstName || 'Driver',
        email: driver.clerkUser.emailAddresses.find((email) => email.id === driver.clerkUser.primaryEmailAddressId)
            ?.emailAddress || 'driver@example.com',
    };
    // Send via Knock
    await knock.workflows.trigger(`driver-${status}`, {
        data: notificationData,
        recipients: [...recipients, driverRecipient],
    });
    // Persist notification in Prisma
    await db.notification.createMany({
        data: recipients.map((recipient) => ({
            userId: parseInt(recipient.id) || 0,
            tripId: trip?.id,
            type: `DRIVER_${status.toUpperCase()}`,
            message: message || `${notificationData.driverName} is now ${status}.`,
            status: 'sent',
            driverId: driver.prismaDriver.driver?.id,
            sentAt: new Date(),
            subject: `Driver ${status.charAt(0).toUpperCase() + status.slice(1)} Notification`,
        })),
    });
    // Update trip status for In-Transit
    if (status === 'in-transit' && trip) {
        await db.trip.update({
            where: { id: trip.id },
            data: { status: 'IN_PROGRESS' },
        });
    }
}
/**
 * Notify relevant users when the driver goes offline
 */
export async function notifyDriverOffline(formData) {
    try {
        const driver = await getAuthenticatedDriver();
        const { message } = validateFormData(formData);
        const recipients = await fetchowners();
        await sendStatusNotification(driver, 'offline', null, message, recipients);
        revalidatePath('/drivers');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify offline status: ${message}`);
    }
}
/**
 * Notify passengers when the driver is in-transit
 */
export async function notifyDriverInTransit(formData) {
    try {
        const driver = await getAuthenticatedDriver();
        const { message } = validateFormData(formData);
        const trip = await fetchDriverTrip(driver.prismaDriver.driver.id);
        if (!trip)
            throw new Error('No active trip found for this driver');
        const recipients = await fetchPassengers(trip.id);
        await sendStatusNotification(driver, 'in-transit', trip, message, recipients);
        revalidatePath('/drivers');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify in-transit status: ${message}`);
    }
}
