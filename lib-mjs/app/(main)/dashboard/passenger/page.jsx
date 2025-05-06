import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/prisma';
import PassengerDashboardClient from './client';
import { ROLES } from '@/utils/constants/roles';
async function withRetry(operation, maxAttempts = 3, delayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}
async function getPassengerData(clerkId) {
    const passenger = await withRetry(async () => {
        const result = await db.user.findUnique({
            where: { clerkId },
            include: {
                reservations: {
                    where: { status: 'CONFIRMED' },
                    include: {
                        trip: {
                            include: { bus: true },
                        },
                    },
                    orderBy: { bookedAt: 'desc' },
                },
            },
        });
        if (!result || result.role !== 'PASSENGER') {
            throw new Error('User is not a passenger');
        }
        return {
            id: result.id,
            clerkId: result.clerkId,
            name: result.name,
            email: result.email,
            image: result.image,
            phoneNumber: result.phoneNumber,
            role: result.role,
            reservations: result.reservations.map((reservation) => ({
                id: reservation.id,
                userId: reservation.userId,
                tripId: reservation.tripId,
                seatId: reservation.seatId,
                status: reservation.status,
                bookedAt: reservation.bookedAt,
                updatedAt: reservation.updatedAt,
                paymentId: reservation.paymentId,
                trip: {
                    id: reservation.trip.id,
                    busId: reservation.trip.busId,
                    driverId: reservation.trip.driverId,
                    departureCity: reservation.trip.departureCity,
                    arrivalCity: reservation.trip.arrivalCity,
                    departureTime: reservation.trip.departureTime,
                    arrivalTime: reservation.trip.arrivalTime,
                    status: reservation.trip.status,
                    isFullyBooked: reservation.trip.isFullyBooked,
                    originLatitude: reservation.trip.originLatitude,
                    destinationLatitude: reservation.trip.destinationLatitude,
                    originLongitude: reservation.trip.originLongitude,
                    destinationLongitude: reservation.trip.destinationLongitude,
                    createdAt: reservation.trip.createdAt,
                    updatedAt: reservation.trip.updatedAt,
                    bus: {
                        id: reservation.trip.bus.id,
                        createdAt: reservation.trip.bus.createdAt,
                        updatedAt: reservation.trip.bus.updatedAt,
                        licensePlate: reservation.trip.bus.licensePlate,
                        capacity: reservation.trip.bus.capacity,
                        model: reservation.trip.bus.model,
                        latitude: reservation.trip.bus.latitude,
                        longitude: reservation.trip.bus.longitude,
                        lastLocationUpdate: reservation.trip.bus.lastLocationUpdate,
                        category: reservation.trip.bus.category,
                        ownerId: reservation.trip.bus.ownerId,
                    },
                },
            })),
        };
    });
    const buses = await withRetry(async () => {
        const result = await db.bus.findMany({
            where: { trips: { some: { status: 'SCHEDULED' } } },
            include: {
                images: {
                    select: { src: true, alt: true },
                },
            },
            take: 10,
        });
        return result.map((bus) => ({
            id: bus.id,
            createdAt: bus.createdAt,
            updatedAt: bus.updatedAt,
            licensePlate: bus.licensePlate,
            capacity: bus.capacity,
            model: bus.model,
            latitude: bus.latitude,
            longitude: bus.longitude,
            lastLocationUpdate: bus.lastLocationUpdate,
            category: bus.category,
            ownerId: bus.ownerId,
            images: bus.images.map((image) => ({
                src: image.src,
                alt: image.alt,
            })),
        }));
    });
    return { passenger, buses };
}
export default async function PassengerPage() {
    const user = await currentUser();
    // Redirect to sign-in if user is not authenticated
    if (!user) {
        redirect('/auth/sign-in');
    }
    const rawRole = user.unsafeMetadata.role?.toUpperCase().trim();
    const role = rawRole || ROLES.PASSENGER;
    // Redirect non-PASSENGER roles
    switch (role) {
        case ROLES.PASSENGER:
            break;
        case ROLES.DRIVER:
            redirect('/dashboard/driver');
        case ROLES.OWNER:
            redirect('/dashboard/owner');
        default:
            redirect('/');
    }
    const userData = {
        id: user.id,
        firstName: user.firstName || 'Passenger',
    };
    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return (<PassengerDashboardClient userData={userData} passenger={passenger} buses={buses} error={null} role={role}/>);
    }
    catch (error) {
        console.error('Error fetching passenger data:', error);
        return (<PassengerDashboardClient userData={userData} passenger={null} buses={[]} error={error instanceof Error ? error.message : 'Failed to load dashboard data'} role={role}/>);
    }
}
