'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { saveGeofence, getGeofences, getGeofenceById, updateGeofence, deleteGeofence } from '@/lib/dbGeofence';

interface Geofence {
    id: number;
    ownerId: number;
    name: string;
    coordinates: { latitude: number; longitude: number };
    radius: number;
    createdAt: string;
}

// Validation Schemas
const geofenceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    coordinates: z.object({
        latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
        longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    }),
    radius: z.number().positive('Radius must be a positive number'),
});

const updateGeofenceSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    coordinates: z
        .object({
            latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
            longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
        })
        .optional(),
    radius: z.number().positive('Radius must be a positive number').optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z
    .object({
        name: z.string().optional(),
        minRadius: z.number().nonnegative('Minimum radius must be non-negative').optional(),
        maxRadius: z.number().positive('Maximum radius must be positive').optional(),
    })
    .refine((data) => !data.minRadius || !data.maxRadius || data.minRadius <= data.maxRadius, {
        message: 'minRadius cannot be greater than maxRadius',
    });

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Save a new geofence
export async function saveGeofenceAction(formData: FormData): Promise<Geofence> {
    try {
        const clerkId = await getClerkId();

        const data = {
            name: formData.get('name') as string,
            coordinates: {
                latitude: Number(formData.get('latitude')),
                longitude: Number(formData.get('longitude')),
            },
            radius: Number(formData.get('radius')),
        };

        const validatedData = geofenceSchema.parse(data);
        const geofence = await saveGeofence(clerkId, validatedData);

        revalidatePath('/geofences');
        return geofence;
    } catch (error) {
        console.error('saveGeofenceAction error:', error);
        throw new Error('Failed to save geofence');
    }
}

// Get geofences with pagination and filters
export async function getGeofencesAction({
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    page?: number;
    pageSize?: number;
    filters?: { name?: string; minRadius?: number; maxRadius?: number };
}): Promise<{ geofences: Geofence[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getGeofences({
            clerkId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getGeofencesAction error:', error);
        throw new Error('Failed to fetch geofences');
    }
}

// Get a geofence by ID
export async function getGeofenceByIdAction(geofenceId: number): Promise<Geofence> {
    try {
        const clerkId = await getClerkId();
        return await getGeofenceById(clerkId, geofenceId);
    } catch (error) {
        console.error('getGeofenceByIdAction error:', error);
        throw new Error('Failed to fetch geofence');
    }
}

// Update a geofence
export async function updateGeofenceAction(geofenceId: number, formData: FormData): Promise<Geofence> {
    try {
        const clerkId = await getClerkId();

        const data = {
            name: formData.get('name') as string | undefined,
            coordinates:
                formData.get('latitude') && formData.get('longitude')
                    ? {
                          latitude: Number(formData.get('latitude')),
                          longitude: Number(formData.get('longitude')),
                      }
                    : undefined,
            radius: formData.get('radius') ? Number(formData.get('radius')) : undefined,
        };

        const validatedData = updateGeofenceSchema.parse(data);
        const geofence = await updateGeofence(clerkId, geofenceId, validatedData);

        revalidatePath(`/geofences/${geofenceId}`);
        return geofence;
    } catch (error) {
        console.error('updateGeofenceAction error:', error);
        throw new Error('Failed to update geofence');
    }
}

// Delete a geofence
export async function deleteGeofenceAction(geofenceId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteGeofence(clerkId, geofenceId);

        revalidatePath('/geofences');
        redirect('/geofences');
    } catch (error) {
        console.error('deleteGeofenceAction error:', error);
        throw new Error('Failed to delete geofence');
    }
}
