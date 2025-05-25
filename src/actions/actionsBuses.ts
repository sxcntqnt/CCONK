'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import {
    createBus,
    updateBus,
    deleteBus,
    getBus,
    getBuses,
    getBusByDriverId,
    getBusDetailsForDriverTrip,
} from '@/lib/prisma/dbBuses';
import { Bus } from '@/lib/prisma/dbTypes';
import { MatatuCapacity, validCapacities } from '@/utils/constants/matatuSeats';

// Validation Schemas
const createBusSchema = z.object({
    licensePlate: z.string().min(1, 'License plate is required'),
    capacity: z.enum(validCapacities, {
        message: `Capacity must be one of ${validCapacities.join(', ')}`,
    }),
    model: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    category: z.string().min(1, 'Category is required'),
    ownerId: z.number().positive('Owner ID must be a positive number'),
    imageSrcs: z.array(z.string()).optional(),
});

const updateBusSchema = z.object({
    licensePlate: z.string().min(1, 'License plate is required').optional(),
    capacity: z
        .enum(validCapacities, {
            message: `Capacity must be one of ${validCapacities.join(', ')}`,
        })
        .optional(),
    model: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    category: z.string().min(1, 'Category is required').optional(),
    imageSrcs: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    licensePlate: z.string().optional(),
    capacity: z.enum(validCapacities).optional(), // Updated to match MatatuCapacity
});

const driverTripSchema = z.object({
    driverId: z.number().positive('Driver ID must be a positive number'),
});

// Helper to get authenticated clerkId using currentUser
async function getClerkId() {
    const user = await currentUser();
    if (!user?.id) {
        throw new Error('Unauthorized');
    }
    return user.id;
}

// Create a new bus
export async function createBusAction(formData: FormData): Promise<Bus> {
    try {
        const clerkId = await getClerkId();

        const data = {
            licensePlate: formData.get('licensePlate') as string,
            capacity: formData.get('capacity') as MatatuCapacity, // Treat as string
            model: formData.get('model') as string | undefined,
            latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
            longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
            category: formData.get('category') as string,
            ownerId: Number(formData.get('ownerId')),
            imageSrcs: formData.get('imageSrcs') ? JSON.parse(formData.get('imageSrcs') as string) : undefined,
        };

        const validatedData = createBusSchema.parse(data);
        const bus = await createBus(validatedData, clerkId);

        revalidatePath('/buses');
        return bus;
    } catch (error) {
        console.error('createBusAction error:', error);
        throw new Error('Failed to create bus');
    }
}

// Get a bus by ID
export async function getBusAction(busId: number): Promise<Bus> {
    try {
        const clerkId = await getClerkId();
        return await getBus(busId, clerkId);
    } catch (error) {
        console.error('getBusAction error:', error);
        throw new Error('Failed to fetch bus');
    }
}

// Get buses with pagination and filters
export async function getBusesAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId?: number;
    page?: number;
    pageSize?: number;
    filters?: { licensePlate?: string; capacity?: MatatuCapacity }; // Updated to MatatuCapacity
}): Promise<{ buses: Bus[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getBuses({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
            clerkId,
        });
    } catch (error) {
        console.error('getBusesAction error:', error);
        throw new Error('Failed to fetch buses');
    }
}

// Update a bus
export async function updateBusAction(busId: number, formData: FormData): Promise<Bus> {
    try {
        const clerkId = await getClerkId();

        const data = {
            licensePlate: formData.get('licensePlate') as string | undefined,
            capacity: formData.get('capacity') as MatatuCapacity | undefined, // Treat as string
            model: formData.get('model') as string | null | undefined,
            latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
            longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
            category: formData.get('category') as string | undefined,
            imageSrcs: formData.get('imageSrcs') ? JSON.parse(formData.get('imageSrcs') as string) : undefined,
        };

        const validatedData = updateBusSchema.parse(data);
        const bus = await updateBus(busId, validatedData, clerkId);

        revalidatePath(`/buses/${busId}`);
        return bus;
    } catch (error) {
        console.error('updateBusAction error:', error);
        throw new Error('Failed to update bus');
    }
}

// Delete a bus
export async function deleteBusAction(busId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteBus(busId, clerkId);

        revalidatePath('/buses');
        redirect('/buses');
    } catch (error) {
        console.error('deleteBusAction error:', error);
        throw new Error('Failed to delete bus');
    }
}

// Get bus by driver ID
export async function getBusByDriverIdAction(driverId: number): Promise<Bus> {
    try {
        const clerkId = await getClerkId();
        return await getBusByDriverId(driverId, clerkId);
    } catch (error) {
        console.error('getBusByDriverIdAction error:', error);
        throw new Error('Failed to fetch bus by driver ID');
    }
}

// Get bus details for driver’s active trip
export async function getBusDetailsForDriverTripAction(driverId: number): Promise<Bus> {
    try {
        const clerkId = await getClerkId();
        const validatedData = driverTripSchema.parse({ driverId });
        return await getBusDetailsForDriverTrip({ driverId: validatedData.driverId, clerkId });
    } catch (error) {
        console.error('getBusDetailsForDriverTripAction error:', error);
        throw new Error('Failed to fetch bus details for driver trip');
    }
}
