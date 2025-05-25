'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { saveTracking, getTrackingRecords, getTrackingById, updateTracking } from '@/lib/dbTracking';
import { Tracking } from '@/lib/prisma/dbtypes';

// Validation Schemas
const saveTrackingSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    altitude: z.number().optional(),
    speed: z.number().nonnegative().optional(),
    bearing: z.number().min(0).max(360, 'Bearing must be between 0 and 360').optional(),
    accuracy: z.number().nonnegative().optional(),
    provider: z.string().max(50, 'Provider must be 50 characters or less').optional(),
    comment: z.string().max(500, 'Comment must be 500 characters or less').optional(),
});

const updateTrackingSchema = z.object({
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90').optional(),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180').optional(),
    altitude: z.number().optional(),
    speed: z.number().nonnegative().optional(),
    bearing: z.number().min(0).max(360, 'Bearing must be between 0 and 360').optional(),
    accuracy: z.number().nonnegative().optional(),
    provider: z.string().max(50, 'Provider must be 50 characters or less').optional(),
    comment: z.string().max(500, 'Comment must be 500 characters or less').optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    licensePlate: z.string().optional(),
    time: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid time format' })
        .optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Save tracking data
export async function saveTrackingAction(formData: FormData): Promise<Tracking> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: Number(formData.get('busId')),
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            altitude: formData.get('altitude') ? Number(formData.get('altitude')) : undefined,
            speed: formData.get('speed') ? Number(formData.get('speed')) : undefined,
            bearing: formData.get('bearing') ? Number(formData.get('bearing')) : undefined,
            accuracy: formData.get('accuracy') ? Number(formData.get('accuracy')) : undefined,
            provider: formData.get('provider') as string | undefined,
            comment: formData.get('comment') as string | undefined,
        };

        const validatedData = saveTrackingSchema.parse(data);
        const tracking = await saveTracking(clerkId, validatedData);

        revalidatePath('/tracking');
        return tracking;
    } catch (error) {
        console.error('saveTrackingAction error:', error);
        throw new Error('Failed to save tracking data');
    }
}

// Get tracking records
export async function getTrackingRecordsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { busId?: number; licensePlate?: string; time?: string };
}): Promise<{ trackingRecords: Tracking[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getTrackingRecords({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getTrackingRecordsAction error:', error);
        throw new Error('Failed to fetch tracking records');
    }
}

// Get tracking by ID
export async function getTrackingByIdAction(trackingId: number): Promise<Tracking> {
    try {
        const clerkId = await getClerkId();
        return await getTrackingById(clerkId, trackingId);
    } catch (error) {
        console.error('getTrackingByIdAction error:', error);
        throw new Error('Failed to fetch tracking');
    }
}

// Update tracking data
export async function updateTrackingAction(trackingId: number, formData: FormData): Promise<Tracking> {
    try {
        const clerkId = await getClerkId();
        const data = {
            latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
            longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
            altitude: formData.get('altitude') ? Number(formData.get('altitude')) : undefined,
            speed: formData.get('speed') ? Number(formData.get('speed')) : undefined,
            bearing: formData.get('bearing') ? Number(formData.get('bearing')) : undefined,
            accuracy: formData.get('accuracy') ? Number(formData.get('accuracy')) : undefined,
            provider: formData.get('provider') as string | undefined,
            comment: formData.get('comment') as string | undefined,
        };

        const validatedData = updateTrackingSchema.parse(data);
        const tracking = await updateTracking(clerkId, trackingId, validatedData);

        revalidatePath(`/tracking/${trackingId}`);
        return tracking;
    } catch (error) {
        console.error('updateTrackingAction error:', error);
        throw new Error('Failed to update tracking data');
    }
}
