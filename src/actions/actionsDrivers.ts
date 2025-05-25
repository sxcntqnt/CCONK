'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    createDriver,
    getDriver,
    getDrivers,
    updateDriver,
    deleteDriver,
    getDriverById,
    getDriverData,
    getDriverReservations,
    getDriverFuelRecords,
} from '@/lib/dbDrivers';
import { Driver, DriverData, Reservation, Fuel } from '@/lib/prisma/dbtypes';

// Validation Schemas
const createDriverSchema = z.object({
    userId: z.number().positive('User ID must be a positive number'),
    licenseNumber: z.string().min(1, 'License number is required'),
    status: z.enum(['ACTIVE', 'OFFLINE'], { message: 'Invalid status' }),
    busId: z.number().positive('Bus ID must be a positive number').optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
});

const updateDriverSchema = z.object({
    licenseNumber: z.string().min(1, 'License number is required').optional(),
    status: z.enum(['ACTIVE', 'OFFLINE']).optional(),
    busId: z.number().positive('Bus ID must be a positive number').optional().nullable(),
    profileImageUrl: z.string().optional().nullable(),
    rating: z.number().min(0).max(5, 'Rating must be between 0 and 5').optional().nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    licenseNumber: z.string().optional(),
});

const driverFuelSchema = z.object({
    driverId: z.number().positive('Driver ID must be a positive number'),
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create a new driver
export async function createDriverAction(formData: FormData): Promise<Driver> {
    try {
        const clerkId = await getClerkId();

        const data = {
            userId: Number(formData.get('userId')),
            licenseNumber: formData.get('licenseNumber') as string,
            status: formData.get('status') as 'ACTIVE' | 'OFFLINE',
            busId: formData.get('busId') ? Number(formData.get('busId')) : undefined,
            profileImageUrl: formData.get('profileImageUrl') as string | undefined,
        };

        const validatedData = createDriverSchema.parse(data);
        const driver = await createDriver({ ...validatedData, clerkId });

        revalidatePath('/drivers');
        return driver;
    } catch (error) {
        console.error('createDriverAction error:', error);
        throw new Error('Failed to create driver');
    }
}

// Get a driver by ID
export async function getDriverAction(driverId: number): Promise<Driver> {
    try {
        const clerkId = await getClerkId();
        return await getDriver({ driverId, clerkId });
    } catch (error) {
        console.error('getDriverAction error:', error);
        throw new Error('Failed to fetch driver');
    }
}

// Get drivers with pagination and filters
export async function getDriversAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { licenseNumber?: string };
}): Promise<{ drivers: Driver[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getDrivers({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
            clerkId,
        });
    } catch (error) {
        console.error('getDriversAction error:', error);
        throw new Error('Failed to fetch drivers');
    }
}

// Update a driver
export async function updateDriverAction(driverId: number, formData: FormData): Promise<Driver> {
    try {
        const clerkId = await getClerkId();

        const data = {
            licenseNumber: formData.get('licenseNumber') as string | undefined,
            status: formData.get('status') as 'ACTIVE' | 'OFFLINE' | undefined,
            busId: formData.get('busId') ? Number(formData.get('busId')) : undefined,
            profileImageUrl: formData.get('profileImageUrl') as string | undefined,
            rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
        };

        const validatedData = updateDriverSchema.parse(data);
        const driver = await updateDriver(driverId, validatedData, clerkId);

        revalidatePath(`/drivers/${driverId}`);
        return driver;
    } catch (error) {
        console.error('updateDriverAction error:', error);
        throw new Error('Failed to update driver');
    }
}

// Delete a driver
export async function deleteDriverAction(driverId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteDriver(driverId, clerkId);

        revalidatePath('/drivers');
        redirect('/drivers');
    } catch (error) {
        console.error('deleteDriverAction error:', error);
        throw new Error('Failed to delete driver');
    }
}

// Get driver by ID (Simplified)
export async function getDriverByIdAction(driverId: number): Promise<Driver> {
    try {
        const clerkId = await getClerkId();
        return await getDriverById({ driverId, clerkId });
    } catch (error) {
        console.error('getDriverByIdAction error:', error);
        throw new Error('Failed to fetch driver');
    }
}

// Get driver data with trip, reservations, and fuel records
export async function getDriverDataAction(): Promise<DriverData> {
    try {
        const clerkId = await getClerkId();
        return await getDriverData(clerkId);
    } catch (error) {
        console.error('getDriverDataAction error:', error);
        throw new Error('Failed to fetch driver data');
    }
}

// Get driver reservations for active trip
export async function getDriverReservationsAction(driverId: number): Promise<Reservation[]> {
    try {
        const clerkId = await getClerkId();
        return await getDriverReservations({ driverId, clerkId });
    } catch (error) {
        console.error('getDriverReservationsAction error:', error);
        throw new Error('Failed to fetch driver reservations');
    }
}

// Get driver fuel records for assigned bus
export async function getDriverFuelRecordsAction({
    driverId,
    page = 1,
    pageSize = 10,
}: {
    driverId: number;
    page?: number;
    pageSize?: number;
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedData = driverFuelSchema.parse({ driverId, page, pageSize });
        return await getDriverFuelRecords({
            driverId: validatedData.driverId,
            clerkId,
            page: validatedData.page,
            pageSize: validatedData.pageSize,
        });
    } catch (error) {
        console.error('getDriverFuelRecordsAction error:', error);
        throw new Error('Failed to fetch driver fuel records');
    }
}
