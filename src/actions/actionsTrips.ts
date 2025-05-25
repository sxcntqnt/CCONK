'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    createTrip,
    getTripById,
    getTrips,
    updateTrip,
    deleteTrip,
    getActiveTripsForDriver,
    getTripIdForDriver,
    updateTripStatus,
    updateTripStatusAction,
} from '@/lib/dbTrips';
import { Trip } from '@/lib/prisma/dbtypes';

// Validation Schemas
const createTripSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
    driverId: z.number().positive('Driver ID must be a positive number').optional().nullable(),
    departureCity: z.string().min(1, 'Departure city is required'),
    arrivalCity: z.string().min(1, 'Arrival city is required'),
    departureTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid departure time'),
    arrivalTime: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), 'Invalid arrival time')
        .optional()
        .nullable(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
    originLatitude: z.number().optional().nullable(),
    originLongitude: z.number().optional().nullable(),
    destinationLatitude: z.number().optional().nullable(),
    destinationLongitude: z.number().optional().nullable(),
});

const updateTripSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    driverId: z.number().positive('Driver ID must be a positive number').optional().nullable(),
    departureCity: z.string().min(1, 'Departure city is required').optional(),
    arrivalCity: z.string().min(1, 'Arrival city is required').optional(),
    departureTime: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), 'Invalid departure time')
        .optional(),
    arrivalTime: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), 'Invalid arrival time')
        .optional()
        .nullable(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    originLatitude: z.number().optional().nullable(),
    originLongitude: z.number().optional().nullable(),
    destinationLatitude: z.number().optional().nullable(),
    destinationLongitude: z.number().optional().nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    departureCity: z.string().optional(),
    arrivalCity: z.string().optional(),
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
});

const updateTripStatusSchema = z.object({
    tripId: z.number().positive('Trip ID must be a positive number'),
    driverId: z.number().positive('Driver ID must be a positive number'),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create a trip
export async function createTripAction(formData: FormData): Promise<Trip> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: Number(formData.get('busId')),
            driverId: formData.get('driverId') ? Number(formData.get('driverId')) : undefined,
            departureCity: formData.get('departureCity') as string,
            arrivalCity: formData.get('arrivalCity') as string,
            departureTime: formData.get('departureTime') as string,
            arrivalTime: formData.get('arrivalTime') as string | undefined,
            status: formData.get('status') as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | undefined,
            originLatitude: formData.get('originLatitude') ? Number(formData.get('originLatitude')) : undefined,
            originLongitude: formData.get('originLongitude') ? Number(formData.get('originLongitude')) : undefined,
            destinationLatitude: formData.get('destinationLatitude')
                ? Number(formData.get('destinationLatitude'))
                : undefined,
            destinationLongitude: formData.get('destinationLongitude')
                ? Number(formData.get('destinationLongitude'))
                : undefined,
        };

        const validatedData = createTripSchema.parse(data);
        const trip = await createTrip({ ...validatedData, clerkId });

        revalidatePath('/trips');
        return trip;
    } catch (error) {
        console.error('createTripAction error:', error);
        throw new Error('Failed to create trip');
    }
}

// Get a trip by ID
export async function getTripByIdAction(tripId: number): Promise<Trip> {
    try {
        const clerkId = await getClerkId();
        return await getTripById({ tripId, clerkId });
    } catch (error) {
        console.error('getTripByIdAction error:', error);
        throw new Error('Failed to fetch trip');
    }
}

// Get trips
export async function getTripsAction({
    ownerId,
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId?: number;
    driverId?: number;
    page?: number;
    pageSize?: number;
    filters?: {
        departureCity?: string;
        arrivalCity?: string;
        busId?: number;
        status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    };
}): Promise<{ trips: Trip[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getTrips({
            ownerId,
            driverId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
            clerkId,
        });
    } catch (error) {
        console.error('getTripsAction error:', error);
        throw new Error('Failed to fetch trips');
    }
}

// Update a trip
export async function updateTripAction(tripId: number, formData: FormData): Promise<Trip> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: formData.get('busId') ? Number(formData.get('busId')) : undefined,
            driverId: formData.get('driverId') ? Number(formData.get('driverId')) : undefined,
            departureCity: formData.get('departureCity') as string | undefined,
            arrivalCity: formData.get('arrivalCity') as string | undefined,
            departureTime: formData.get('departureTime') as string | undefined,
            arrivalTime: formData.get('arrivalTime') as string | undefined,
            status: formData.get('status') as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | undefined,
            originLatitude: formData.get('originLatitude') ? Number(formData.get('originLatitude')) : undefined,
            originLongitude: formData.get('originLongitude') ? Number(formData.get('originLongitude')) : undefined,
            destinationLatitude: formData.get('destinationLatitude')
                ? Number(formData.get('destinationLatitude'))
                : undefined,
            destinationLongitude: formData.get('destinationLongitude')
                ? Number(formData.get('destinationLongitude'))
                : undefined,
        };

        const validatedData = updateTripSchema.parse(data);
        const trip = await updateTrip(clerkId, tripId, validatedData);

        revalidatePath(`/trips/${tripId}`);
        return trip;
    } catch (error) {
        console.error('updateTripAction error:', error);
        throw new Error('Failed to update trip');
    }
}

// Delete (cancel) a trip
export async function deleteTripAction(tripId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteTrip(clerkId, tripId);

        revalidatePath('/trips');
    } catch (error) {
        console.error('deleteTripAction error:', error);
        throw new Error('Failed to cancel trip');
    }
}

// Get active trips for driver
export async function getActiveTripsForDriverAction(driverId: number): Promise<Trip[]> {
    try {
        const clerkId = await getClerkId();
        return await getActiveTripsForDriver({ driverId, clerkId });
    } catch (error) {
        console.error('getActiveTripsForDriverAction error:', error);
        throw new Error('Failed to fetch active trips');
    }
}

// Get trip ID for driver
export async function getTripIdForDriverAction(driverId: number): Promise<number> {
    try {
        const clerkId = await getClerkId();
        return await getTripIdForDriver({ driverId, clerkId });
    } catch (error) {
        console.error('getTripIdForDriverAction error:', error);
        throw new Error('Failed to fetch trip ID');
    }
}

// Update trip status
export async function updateTripStatusAction(formData: FormData): Promise<{ success: boolean }> {
    try {
        const clerkId = await getClerkId();
        const data = {
            tripId: Number(formData.get('tripId')),
            driverId: Number(formData.get('driverId')),
            status: formData.get('status') as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        };

        const validatedData = updateTripStatusSchema.parse(data);
        const result = await updateTripStatusAction({ ...validatedData, clerkId });

        revalidatePath(`/trips/${data.tripId}`);
        return result;
    } catch (error) {
        console.error('updateTripStatusAction error:', error);
        throw new Error('Failed to update trip status');
    }
}
