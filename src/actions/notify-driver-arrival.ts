// src/actions/notifyDriverArrival.ts
'use server';

import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';
import { Knock } from '@knocklabs/node';
import { prisma } from '@/lib/prisma';
import { getSeats, getBuses } from '@/lib/prisma/dbClient';
import { User } from '@clerk/nextjs/server';

// Types
interface Recipient {
    id: string;
    name: string;
    email: string;
}

interface NotificationData {
    busId: string;
    destination: string;
    arrivalTime: string;
    driverName: string;
}

// Knock instance
const knock = new Knock(process.env.KNOCK_API_SECRET!);

// Helper: Get authenticated driver
async function getAuthenticatedDriver(): Promise<User> {
    const driver = await currentUser();
    if (!driver) throw new Error('Driver not authenticated');
    return driver;
}

// Helper: Validate form data (now only destination)
function validateFormData(formData: FormData): { destination: string } {
    const destination = formData.get('destination') as string;
    if (!destination) throw new Error('Missing destination');
    return { destination };
}

// Helper: Fetch the driver's bus using getBuses
async function fetchDriverBus(driverId: string): Promise<{ id: number; licensePlate: string; capacity: number }> {
    const { buses } = await getBuses(1, 1, driverId); // Fetch only the driver's bus
    if (!buses.length) throw new Error('No bus assigned to this driver');
    return buses[0];
}

// Helper: Fetch reserved seats for a bus using getSeats
async function fetchReservedSeats(busId: number): Promise<Record<string, import('@/lib/prisma/dbClient').SeatData>> {
    const seats = await getSeats(busId);
    const reservedSeats = Object.fromEntries(Object.entries(seats).filter(([, seat]) => seat.status === 'reserved'));
    if (!Object.keys(reservedSeats).length) throw new Error('No reserved seats found for this bus');
    return reservedSeats;
}

// Helper: Build recipients from reserved seats
async function buildRecipients(seats: Record<string, import('@/lib/prisma/dbClient').SeatData>): Promise<Recipient[]> {
    const seatIds = Object.keys(seats).map((id) => parseInt(id));
    const reservations = await prisma.reservation.findMany({
        where: { seatId: { in: seatIds } },
        select: { userId: true, seatId: true },
    });

    return Promise.all(
        reservations.map(async (reservation) => {
            const seat = seats[reservation.seatId.toString()];
            const fallbackId = `passenger_${seat.label}`;
            const fallbackName = `Passenger ${seat.label}`;
            const fallbackEmail = 'passenger@example.com';

            if (!reservation.userId) {
                return { id: fallbackId, name: fallbackName, email: fallbackEmail };
            }

            const user = await prisma.user.findUnique({
                where: { id: reservation.userId },
                select: { email: true, firstName: true },
            });

            return {
                id: reservation.userId || fallbackId,
                name: user?.firstName || fallbackName,
                email: user?.email || fallbackEmail,
            };
        }),
    );
}

// Helper: Send notification via Knock
async function sendArrivalNotification(driver: User, data: NotificationData, recipients: Recipient[]): Promise<void> {
    const driverRecipient: Recipient = {
        id: driver.id,
        name: driver.firstName || 'Driver',
        email:
            driver.emailAddresses.find((email) => email.id === driver.primaryEmailAddressId)?.emailAddress ||
            'driver@example.com',
    };

    await knock.workflows.trigger('driver-arrived', {
        data,
        recipients: [driverRecipient, ...recipients],
    });
}

/**
 * Notify passengers when the driver arrives at the destination
 */
export async function notifyDriverArrival(formData: FormData): Promise<void> {
    try {
        const driver = await getAuthenticatedDriver();
        const { destination } = validateFormData(formData);
        const bus = await fetchDriverBus(driver.id);
        const reservedSeats = await fetchReservedSeats(bus.id);

        const notificationData: NotificationData = {
            busId: bus.id.toString(),
            destination,
            arrivalTime: new Date().toISOString(),
            driverName: driver.firstName || 'Driver',
        };

        const recipients = await buildRecipients(reservedSeats);
        await sendArrivalNotification(driver, notificationData, recipients);
        revalidatePath('/driver/dashboard'); // Restored
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to notify arrival: ${message}`);
    }
}
