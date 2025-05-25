'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    getSeats,
    createSeat,
    getSeatById,
    updateSeat,
    deleteSeat,
    getSeatsForDriverTrip,
    validateSeats,
} from '@/lib/dbSeats';
import { SeatData } from '@/lib/prisma/dbtypes';

// Validation Schemas
const seatSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
    seatNumber: z.string().min(1, 'Seat number is required'),
    price: z
        .number()
        .positive('Price must be positive')
        .default(Number(process.env.DEFAULT_SEAT_PRICE) || 19),
    row: z.number().positive('Row must be a positive number'),
    column: z.number().positive('Column must be a positive number'),
    category: z.enum(['single', 'window', 'aisle', 'middle']).default('middle'),
    status: z.enum(['available', 'reserved']).default('available'),
});

const updateSeatSchema = z.object({
    seatNumber: z.string().min(1, 'Seat number is required').optional(),
    price: z.number().positive('Price must be positive').optional(),
    row: z.number().positive('Row must be a positive number').optional(),
    column: z.number().positive('Column must be a positive number').optional(),
    category: z.enum(['single', 'window', 'aisle', 'middle']).optional(),
    status: z.enum(['available', 'reserved']).optional(),
});

const driverTripSchema = z.object({
    driverId: z.number().positive('Driver ID must be a positive number'),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Get seats for a bus
export async function getSeatsAction(busId: number): Promise<Record<string, SeatData>> {
    try {
        const clerkId = await getClerkId();
        return await getSeats(busId, clerkId);
    } catch (error) {
        console.error('getSeatsAction error:', error);
        throw new Error('Failed to fetch seats');
    }
}

// Create a seat
export async function createSeatAction(formData: FormData): Promise<SeatData> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: Number(formData.get('busId')),
            seatNumber: formData.get('seatNumber') as string,
            price: formData.get('price') ? Number(formData.get('price')) : undefined,
            row: Number(formData.get('row')),
            column: Number(formData.get('column')),
            category: formData.get('category') as 'single' | 'window' | 'aisle' | 'middle' | undefined,
            status: formData.get('status') as 'available' | 'reserved' | undefined,
        };

        const validatedData = seatSchema.parse(data);
        const seat = await createSeat({ ...validatedData, clerkId });

        revalidatePath(`/buses/${data.busId}/seats`);
        return seat;
    } catch (error) {
        console.error('createSeatAction error:', error);
        throw new Error('Failed to create seat');
    }
}

// Get a seat by ID
export async function getSeatByIdAction(seatId: number): Promise<SeatData> {
    try {
        const clerkId = await getClerkId();
        return await getSeatById({ seatId, clerkId });
    } catch (error) {
        console.error('getSeatByIdAction error:', error);
        throw new Error('Failed to fetch seat');
    }
}

// Update a seat
export async function updateSeatAction(seatId: number, formData: FormData): Promise<SeatData> {
    try {
        const clerkId = await getClerkId();
        const data = {
            seatNumber: formData.get('seatNumber') as string | undefined,
            price: formData.get('price') ? Number(formData.get('price')) : undefined,
            row: formData.get('row') ? Number(formData.get('row')) : undefined,
            column: formData.get('column') ? Number(formData.get('column')) : undefined,
            category: formData.get('category') as 'single' | 'window' | 'aisle' | 'middle' | undefined,
            status: formData.get('status') as 'available' | 'reserved' | undefined,
        };

        const validatedData = updateSeatSchema.parse(data);
        const seat = await updateSeat(seatId, validatedData, clerkId);

        revalidatePath(`/seats/${seatId}`);
        return seat;
    } catch (error) {
        console.error('updateSeatAction error:', error);
        throw new Error('Failed to update seat');
    }
}

// Delete a seat
export async function deleteSeatAction(seatId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteSeat(seatId, clerkId);

        revalidatePath('/seats');
    } catch (error) {
        console.error('deleteSeatAction error:', error);
        throw new Error('Failed to delete seat');
    }
}

// Get seats for driver's active trip
export async function getSeatsForDriverTripAction(driverId: number): Promise<Record<string, SeatData>> {
    try {
        const clerkId = await getClerkId();
        const validatedData = driverTripSchema.parse({ driverId });
        return await getSeatsForDriverTrip({ driverId: validatedData.driverId, clerkId });
    } catch (error) {
        console.error('getSeatsForDriverTripAction error:', error);
        throw new Error('Failed to fetch seats for driver trip');
    }
}

// Validate seats
export async function validateSeatsAction(busId: number): Promise<boolean> {
    try {
        return await validateSeats(busId);
    } catch (error) {
        console.error('validateSeatsAction error:', error);
        throw new Error('Failed to validate seats');
    }
}
