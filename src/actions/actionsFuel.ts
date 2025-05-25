'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    createFuel,
    addFuelRecord,
    getFuelRecords,
    getFuelRecordById,
    updateFuelRecord,
    getFuelRecordsForDriver,
} from '@/lib/dbFuel';
import { Fuel } from '@/lib/prisma/dbtypes';

// Validation Schemas
const fuelSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
    fuel_quantity: z.number().positive('Fuel quantity must be positive'),
    odometerreading: z.number().nonnegative('Odometer reading must be non-negative'),
    fuelprice: z.number().positive('Fuel price must be positive'),
    fuelfilldate: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'Invalid fuel fill date',
    }),
    fueladdedby: z.string().min(1, 'Fuel added by is required'),
    fuelcomments: z.string().optional().nullable(),
});

const updateFuelSchema = z.object({
    fuel_quantity: z.number().positive('Fuel quantity must be positive').optional(),
    odometerreading: z.number().nonnegative('Odometer reading must be non-negative').optional(),
    fuelprice: z.number().positive('Fuel price must be positive').optional(),
    fuelfilldate: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid fuel fill date' })
        .optional(),
    fueladdedby: z.string().min(1, 'Fuel added by is required').optional(),
    fuelcomments: z.string().optional().nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    fuelfilldate: z
        .string()
        .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Invalid fuel fill date' })
        .optional(),
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

// Create a fuel record
export async function createFuelAction(formData: FormData): Promise<Fuel> {
    try {
        const clerkId = await getClerkId();

        const data = {
            busId: Number(formData.get('busId')),
            fuel_quantity: Number(formData.get('fuel_quantity')),
            odometerreading: Number(formData.get('odometerreading')),
            fuelprice: Number(formData.get('fuelprice')),
            fuelfilldate: formData.get('fuelfilldate') as string,
            fueladdedby: formData.get('fueladdedby') as string,
            fuelcomments: formData.get('fuelcomments') as string | undefined,
        };

        const validatedData = fuelSchema.parse(data);
        const fuel = await createFuel(clerkId, validatedData);

        revalidatePath('/fuel');
        return fuel;
    } catch (error) {
        console.error('createFuelAction error:', error);
        throw new Error('Failed to create fuel record');
    }
}

// Add a fuel record (alternative creation function)
export async function addFuelRecordAction(formData: FormData): Promise<Fuel> {
    try {
        const clerkId = await getClerkId();

        const data = {
            ownerId: Number(formData.get('ownerId')),
            busId: Number(formData.get('busId')),
            fuel_quantity: Number(formData.get('fuel_quantity')),
            odometerreading: Number(formData.get('odometerreading')),
            fuelprice: Number(formData.get('fuelprice')),
            fuelfilldate: formData.get('fuelfilldate') as string,
            fueladdedby: formData.get('fueladdedby') as string,
            fuelcomments: formData.get('fuelcomments') as string | undefined,
        };

        const validatedData = fuelSchema.parse({
            busId: data.busId,
            fuel_quantity: data.fuel_quantity,
            odometerreading: data.odometerreading,
            fuelprice: data.fuelprice,
            fuelfilldate: data.fuelfilldate,
            fueladdedby: data.fueladdedby,
            fuelcomments: data.fuelcomments,
        });

        const fuel = await addFuelRecord({ ...data, clerkId });

        revalidatePath('/fuel');
        return fuel;
    } catch (error) {
        console.error('addFuelRecordAction error:', error);
        throw new Error('Failed to add fuel record');
    }
}

// Get fuel records with pagination and filters
export async function getFuelRecordsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { busId?: number; fuelfilldate?: string };
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getFuelRecords({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
            clerkId,
        });
    } catch (error) {
        console.error('getFuelRecordsAction error:', error);
        throw new Error('Failed to fetch fuel records');
    }
}

// Get a single fuel record by ID
export async function getFuelRecordByIdAction(fuelId: number): Promise<Fuel> {
    try {
        const clerkId = await getClerkId();
        return await getFuelRecordById(clerkId, fuelId);
    } catch (error) {
        console.error('getFuelRecordByIdAction error:', error);
        throw new Error('Failed to fetch fuel record');
    }
}

// Update a fuel record
export async function updateFuelRecordAction(fuelId: number, formData: FormData): Promise<Fuel> {
    try {
        const clerkId = await getClerkId();

        const data = {
            fuel_quantity: formData.get('fuel_quantity') ? Number(formData.get('fuel_quantity')) : undefined,
            odometerreading: formData.get('odometerreading') ? Number(formData.get('odometerreading')) : undefined,
            fuelprice: formData.get('fuelprice') ? Number(formData.get('fuelprice')) : undefined,
            fuelfilldate: formData.get('fuelfilldate') as string | undefined,
            fueladdedby: formData.get('fueladdedby') as string | undefined,
            fuelcomments: formData.get('fuelcomments') as string | undefined,
        };

        const validatedData = updateFuelSchema.parse(data);
        const fuel = await updateFuelRecord(clerkId, fuelId, validatedData);

        revalidatePath(`/fuel/${fuelId}`);
        return fuel;
    } catch (error) {
        console.error('updateFuelRecordAction error:', error);
        throw new Error('Failed to update fuel record');
    }
}

// Get fuel records for a driver’s assigned bus
export async function getFuelRecordsForDriverAction({
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: number;
    page?: number;
    pageSize?: number;
    filters?: { fuelfilldate?: string };
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getFuelRecordsForDriver({
            driverId,
            clerkId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getFuelRecordsForDriverAction error:', error);
        throw new Error('Failed to fetch fuel records for driver');
    }
}
