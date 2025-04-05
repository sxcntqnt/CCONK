import { db } from '@/lib';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';

// Fetch driver and trip data server-side
export async function getDriverData(clerkId: string) {
    const driver = await db.user.findUnique({
        where: { clerkId },
        include: {
            driver: {
                include: {
                    trips: {
                        where: { status: { in: ['scheduled', 'in_progress'] }, arrivalTime: null },
                        include: { bus: true },
                        orderBy: { departureTime: 'desc' },
                        take: 1, // Most recent active trip
                    },
                },
            },
        },
    });

    if (!driver || driver.role !== 'DRIVER' || !driver.driver) {
        throw new Error('User  is not a driver or has no driver profile');
    }

    return {
        driver,
        trip: driver.driver.trips[0] || null, // Active trip or null
    };
}
// Server action wrapper for notifyDriverArrival
export async function handleArrival(formData: FormData) {
    'use server';
    await notifyDriverArrival(formData);
}
