'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    saveGeofenceEvent,
    getGeofenceEvents,
    getGeofenceEventById,
    initializeTile38Geofences,
} from '@/lib/dbGeofenceEvents';
import { GeofenceEvent } from '@/lib/prisma/dbtypes';

// Validation Schemas
const geofenceEventSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
    geofenceId: z.number().positive('Geofence ID must be a positive number'),
    event: z.enum(['ENTER', 'EXIT'], { message: 'Event must be either ENTER or EXIT' }),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    geofenceId: z.number().positive('Geofence ID must be a positive number').optional(),
    event: z.enum(['ENTER', 'EXIT']).optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Save a new geofence event
export async function saveGeofenceEventAction(formData: FormData): Promise<GeofenceEvent> {
    try {
        const data = {
            busId: Number(formData.get('busId')),
            geofenceId: Number(formData.get('geofenceId')),
            event: formData.get('event') as 'ENTER' | 'EXIT',
        };

        const validatedData = geofenceEventSchema.parse(data);
        const geofenceEvent = await saveGeofenceEvent(validatedData);

        revalidatePath('/geofence-events');
        return geofenceEvent;
    } catch (error) {
        console.error('saveGeofenceEventAction error:', error);
        throw new Error('Failed to save geofence event');
    }
}

// Get geofence events with pagination and filters
export async function getGeofenceEventsAction({
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    page?: number;
    pageSize?: number;
    filters?: { busId?: number; geofenceId?: number; event?: string };
}): Promise<{ geofenceEvents: GeofenceEvent[]; total: number }> {
    try {
        const clerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getGeofenceEvents({
            clerkId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getGeofenceEventsAction error:', error);
        throw new Error('Failed to fetch geofence events');
    }
}

// Get a geofence event by ID
export async function getGeofenceEventByIdAction(eventId: number): Promise<GeofenceEvent> {
    try {
        const clerkId = await getClerkId();
        return await getGeofenceEventById(clerkId, eventId);
    } catch (error) {
        console.error('getGeofenceEventByIdAction error:', error);
        throw new Error('Failed to fetch geofence event');
    }
}

// Initialize Tile38 geofences
export async function initializeTile38GeofencesAction(): Promise<{ ok: boolean; count: number }> {
    try {
        return await initializeTile38Geofences();
    } catch (error) {
        console.error('initializeTile38GeofencesAction error:', error);
        throw new Error('Failed to initialize Tile38 geofences');
    }
}
