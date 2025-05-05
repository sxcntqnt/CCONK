"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyDriverArrival = notifyDriverArrival;
const server_1 = require("@clerk/nextjs/server");
const node_1 = require("@knocklabs/node");
const lib_1 = require("@/lib");
const roles_1 = require("@/utils/constants/roles");
// Knock instance
const knock = new node_1.Knock(process.env.KNOCK_API_SECRET);
// Helper: Get authenticated driver and verify role
async function getAuthenticatedDriver() {
    const user = await (0, server_1.currentUser)();
    if (!user)
        throw new Error('User not authenticated');
    const driver = await lib_1.db.user.findUnique({
        where: { clerkId: user.id },
        include: { driver: true },
    });
    if (!driver ||
        (driver.role !== roles_1.ROLES.DRIVER && driver.role !== roles_1.ROLES.OWNER) ||
        (!driver.driver && driver.role === roles_1.ROLES.DRIVER)) {
        throw new Error('Authenticated user is not authorized to send notifications');
    }
    return { clerkUser: user, prismaDriver: driver };
}
// Helper: Validate form data
function validateFormData(formData) {
    const destinationRaw = formData.get('destination');
    const messageRaw = formData.get('message');
    if (!destinationRaw || typeof destinationRaw !== 'string') {
        throw new Error('Destination is required');
    }
    const destination = validateDestination(destinationRaw);
    const message = messageRaw && typeof messageRaw === 'string' ? validateMessage(messageRaw) : undefined;
    return { destination, message };
}
// Helper: Validate and sanitize destination
function validateDestination(destination) {
    const trimmed = destination.trim().substring(0, 100);
    if (!trimmed || trimmed.length < 2) {
        throw new Error('Destination must be at least 2 characters');
    }
    const sanitized = trimmed.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    if (!sanitized)
        throw new Error('Invalid destination format');
    return sanitized;
}
// Helper: Validate and sanitize message
function validateMessage(message) {
    const trimmed = message.trim().substring(0, 500);
    if (trimmed.length === 0)
        return '';
    const sanitized = trimmed.replace(/[^a-zA-Z0-9\s,.-?!]/g, '');
    return sanitized;
}
// Helper: Fetch the driver's active trip
async function fetchDriverTrip(driverId) {
    const trip = await lib_1.db.trip.findFirst({
        where: {
            driverId,
            status: { in: ['scheduled', 'in_progress'] },
            arrivalTime: null,
        },
        include: { bus: true },
        orderBy: { departureTime: 'desc' },
    });
    if (!trip)
        throw new Error('No active trip found for this driver');
    return trip;
}
// Helper: Fetch passengers from reservations
async function fetchPassengers(tripId) {
    const reservations = await lib_1.db.reservation.findMany({
        where: { tripId, status: 'confirmed' },
        include: { user: { select: { clerkId: true, name: true, email: true } } },
    });
    if (!reservations.length)
        throw new Error('No confirmed passengers found for this trip');
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
// Helper: Send and persist notification
async function sendArrivalNotification(driver, trip, destination, message, recipients) {
    const notificationData = {
        busId: trip.busId.toString(),
        tripId: trip.id.toString(),
        destination,
        arrivalTime: new Date().toISOString(),
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
    await knock.workflows.trigger('driver-arrived', {
        data: notificationData,
        recipients: recipients,
    });
    // Persist notification in Prisma
    await lib_1.db.notification.createMany({
        data: recipients.map((recipient) => ({
            userId: parseInt(recipient.id) || 0,
            tripId: trip.id,
            type: 'DRIVER_ARRIVAL',
            message: message || `${notificationData.driverName} has arrived at ${destination} with bus ${trip.busId}.`,
            status: 'sent',
            driverId: driver.prismaDriver.driver?.id,
            sentAt: new Date(),
            subject: `Driver Arrival at ${destination}`, // Add subject field
        })),
    });
    // Update trip status
    await lib_1.db.trip.update({
        where: { id: trip.id },
        data: { status: 'completed', arrivalTime: new Date() },
    });
}
/**
 * Notify passengers when the driver arrives at the destination
 */
async function notifyDriverArrival(formData) {
    try {
        const driver = await getAuthenticatedDriver();
        const { destination, message } = validateFormData(formData);
        const trip = await fetchDriverTrip(driver.prismaDriver.driver.id);
        const recipients = await fetchPassengers(trip.id);
        await sendArrivalNotification(driver, trip, destination, message, recipients);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify arrival: ${message}`);
    }
}
