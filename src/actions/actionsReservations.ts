'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    createTripReservation,
    reserveSeats,
    updateReservation,
    cancelReservation,
    getReservations,
    getReservationById,
    getUsersWithReservations,
    getReservationCount,
    resetReservations,
} from '@/lib/dbReservations';
import { Reservation, User } from '@/lib/prisma/dbtypes';

// Validation Schemas
const createReservationSchema = z.object({
    tripId: z.number().positive('Trip ID must be a positive number'),
    seatId: z.number().positive('Seat ID must be a positive number'),
});

const bulkReservationSchema = z.object({
    tripId: z.number().positive('Trip ID must be a positive number'),
    seatIds: z.array(z.number().positive('Seat ID must be a positive number')).min(1, 'At least one seat is required'),
});

const updateReservationSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled'], { message: 'Invalid reservation status' }).optional(),
    paymentId: z.string().max(100, 'Payment ID must be 100 characters or less').optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    tripId: z.number().positive('Trip ID must be a positive number').optional(),
    status: z.enum(['pending', 'confirmed', 'cancelled'], { message: 'Invalid reservation status' }).optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create a single reservation
export async function createTripReservationAction(formData: FormData): Promise<Reservation> {
    try {
        const clerkId = await getClerkId();
        const data = {
            tripId: Number(formData.get('tripId')),
            seatId: Number(formData.get('seatId')),
        };

        const validatedData = createReservationSchema.parse(data);
        const reservation = await createTripReservation({ ...validatedData, clerkId });

        revalidatePath('/reservations');
        return reservation;
    } catch (error) {
        console.error('createTripReservationAction error:', error);
        throw new Error('Failed to create reservation');
    }
}

// Create bulk reservations
export async function reserveSeatsAction(formData: FormData): Promise<{ success: boolean; reservedCount: number }> {
    try {
        const clerkId = await getClerkId();
        const data = {
            tripId: Number(formData.get('tripId')),
            seatIds: JSON.parse(formData.get('seatIds') as string),
        };

        const validatedData = bulkReservationSchema.parse(data);
        const result = await reserveSeats({ ...validatedData, clerkId });

        revalidatePath('/reservations');
        return result;
    } catch (error) {
        console.error('reserveSeatsAction error:', error);
        throw new Error('Failed to reserve seats');
    }
}

// Update a reservation
export async function updateReservationAction(reservationId: number, formData: FormData): Promise<Reservation> {
    try {
        const clerkId = await getClerkId();
        const data = {
            status: formData.get('status') as 'pending' | 'confirmed' | 'cancelled' | undefined,
            paymentId: formData.get('paymentId') as string | undefined,
        };

        const validatedData = updateReservationSchema.parse(data);
        const reservation = await updateReservation(clerkId, reservationId, validatedData);

        revalidatePath(`/reservations/${reservationId}`);
        return reservation;
    } catch (error) {
        console.error('updateReservationAction error:', error);
        throw new Error('Failed to update reservation');
    }
}

// Cancel a reservation
export async function cancelReservationAction(reservationId: number): Promise<Reservation> {
    try {
        const clerkId = await getClerkId();
        const reservation = await cancelReservation(clerkId, reservationId);

        revalidatePath(`/reservations/${reservationId}`);
        return reservation;
    } catch (error) {
        console.error('cancelReservationAction error:', error);
        throw new Error('Failed to cancel reservation');
    }
}

// Get reservations with pagination and filters
export async function getReservationsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { tripId?: number; status?: 'pending' | 'confirmed' | 'cancelled' };
}): Promise<{ reservations: (Reservation & { user: { id: number; name: string; email: string } })[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getReservations({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getReservationsAction error:', error);
        throw new Error('Failed to fetch reservations');
    }
}

// Get a reservation by ID
export async function getReservationByIdAction({
    ownerId,
    id,
}: {
    ownerId: number;
    id: number;
}): Promise<Reservation & { user: { id: number; name: string; email: string } }> {
    try {
        return await getReservationById({ ownerId, id });
    } catch (error) {
        console.error('getReservationByIdAction error:', error);
        throw new Error('Failed to fetch reservation');
    }
}

// Get users with reservations
export async function getUsersWithReservationsAction(tripId: number): Promise<User[]> {
    try {
        return await getUsersWithReservations(tripId);
    } catch (error) {
        console.error('getUsersWithReservationsAction error:', error);
        throw new Error('Failed to fetch users with reservations');
    }
}

// Get reservation count
export async function getReservationCountAction(tripId: number): Promise<number> {
    try {
        return await getReservationCount(tripId);
    } catch (error) {
        console.error('getReservationCountAction error:', error);
        throw new Error('Failed to fetch reservation count');
    }
}

// Reset reservations (Admin Only)
export async function resetReservationsAction(busId: number): Promise<{ success: boolean; deletedCount: number }> {
    try {
        const authenticatedClerkId = await getClerkId();
        const result = await resetReservations(authenticatedClerkId, busId);

        revalidatePath('/reservations');
        return result;
    } catch (error) {
        console.error('resetReservationsAction error:', error);
        throw new Error('Failed to reset reservations');
    }
}
