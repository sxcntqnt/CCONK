// src/actions/notifyDriverArrival.ts
'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { Knock } from '@knocklabs/node';
import { db } from '@/lib';
import { ROLES, Role } from '@/utils/constants/roles'; // Updated import
import { Prisma, Reservation, User } from '@prisma/client';

interface ReservationWithUser extends Reservation {
    user: Pick<User, 'clerkId' | 'name' | 'email'> | null;
}

// Types
interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface NotificationData {
    busId: string;
    tripId: string;
    destination: string;
    arrivalTime: string;
    driverName: string;
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

    // Use ROLES.DRIVER instead of Role.DRIVER
    if (!driver || driver.role !== ROLES.DRIVER || !driver.driver) {
        throw new Error('Authenticated user is not a driver');
    }

    return { clerkUser: user, prismaDriver: driver };
}

// Helper: Validate form data
function validateFormData(formData: FormData): { destination: string } {
    const destinationRaw = formData.get('destination');
    if (!destinationRaw || typeof destinationRaw !== 'string') {
        throw new Error('Destination is required');
    }
    const destination = validateDestination(destinationRaw);
    return { destination };
}

// Helper: Validate and sanitize destination
function validateDestination(destination: string): string {
    const trimmed = destination.trim().substring(0, 100); // Max 100 chars
    if (!trimmed || trimmed.length < 2) {
        throw new Error('Destination must be at least 2 characters');
    }
    const sanitized = trimmed.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    if (!sanitized) throw new Error('Invalid destination format');
    return sanitized;
}

// Helper: Fetch the driver's active trip
async function fetchDriverTrip(driverId: number) {
    const trip = await db.trip.findFirst({
        where: {
            driverId,
            status: { in: ['scheduled', 'in_progress'] },
            arrivalTime: null,
        },
        include: { bus: true },
        orderBy: { departureTime: 'desc' },
    });

    if (!trip) throw new Error('No active trip found for this driver');
    return trip;
}

// Helper: Fetch passengers from reservations
async function fetchPassengers(tripId: number): Promise<Recipient[]> {
    const reservations = await db.reservation.findMany({
        where: { tripId, status: 'confirmed' },
        include: { user: { select: { clerkId: true, name: true, email: true } } },
    });

    if (!reservations.length) throw new Error('No confirmed passengers found for this trip');

    return reservations.map((reservation: Reservation & { user: Pick<User, 'clerkId' | 'name' | 'email'> | null }) => {
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
async function sendArrivalNotification(
    driver: { clerkUser: any; prismaDriver: any },
    trip: any,
    destination: string,
    recipients: Recipient[],
): Promise<void> {
    const notificationData: NotificationData = {
        busId: trip.busId.toString(),
        tripId: trip.id.toString(),
        destination,
        arrivalTime: new Date().toISOString(),
        driverName: driver.clerkUser.firstName || 'Driver',
    };

    const driverRecipient: Recipient = {
        id: driver.clerkUser.id,
        name: driver.clerkUser.firstName || 'Driver',
        email:
            driver.clerkUser.emailAddresses.find((email: any) => email.id === driver.clerkUser.primaryEmailAddressId)
                ?.emailAddress || 'driver@example.com',
    };

    // Send via Knock
    await knock.workflows.trigger('driver-arrived', {
        data: notificationData,
        recipients: [driverRecipient, ...recipients],
    });

    // Persist notification in Prisma
    await db.notification.createMany({
        data: recipients.map((recipient) => ({
            userId: parseInt(recipient.id) || 0, // Fallback if not numeric
            tripId: trip.id,
            type: 'DRIVER_ARRIVAL',
            message: `${notificationData.driverName} has arrived at ${destination} with bus ${trip.busId}.`,
            status: 'sent',
            driverId: driver.prismaDriver.driver!.id,
            sentAt: new Date(),
        })),
    });

    // Update trip status
    await db.trip.update({
        where: { id: trip.id },
        data: { status: 'completed', arrivalTime: new Date() },
    });
}

/**
 * Notify passengers when the driver arrives at the destination
 */
export async function notifyDriverArrival(formData: FormData): Promise<void> {
    try {
        const driver = await getAuthenticatedDriver();
        const { destination } = validateFormData(formData);
        const trip = await fetchDriverTrip(driver.prismaDriver.driver!.id);
        const recipients = await fetchPassengers(trip.id);

        await sendArrivalNotification(driver, trip, destination, recipients);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify arrival: ${message}`);
    }
}
