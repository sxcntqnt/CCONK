'use server';

import { db } from '@/lib/prisma';
import { Role } from '@/utils';
import { Tile38 } from '@iwpnd/tile38-ts';
import { z } from 'zod';

// Types
interface Geofence {
    id: string;
    ownerId: string | null;
    name: string;
    geoJson: { type: string; coordinates: [number, number]; radius: number };
    createdAt: string;
}

// Environment Variables
const config = {
    TILE38_HOST: process.env.TILE38_HOST || 'localhost:9851',
    WEBHOOK_URL: process.env.GEOFENCE_WEBHOOK_URL || 'http://localhost:3000/api/geofence-webhook',
    TILE38_WEBHOOK_SECRET: process.env.TILE38_WEBHOOK_SECRET,
};

if (!config.TILE38_WEBHOOK_SECRET) {
    throw new Error('TILE38_WEBHOOK_SECRET is not set in environment variables');
}

// Initialize Tile38 client
const tile38 = new Tile38(config.TILE38_HOST);
tile38.on('connect', () => console.log('Connected to Tile38'));
tile38.on('error', (err) => console.error(`Tile38 error: ${err}`));

// Validation Schemas
const schemas = {
    saveGeofence: z.object({
        clerkId: z.string().min(1, 'Invalid clerk ID'),
        name: z.string().min(1, 'Invalid name: must be a non-empty string'),
        coordinates: z.object({
            latitude: z.number().min(-90, 'Invalid latitude: must be between -90 and 90').max(90),
            longitude: z.number().min(-180, 'Invalid longitude: must be between -180 and 180').max(180),
        }),
        radius: z.number().positive('Invalid radius: must be a positive number'),
    }),
    getGeofences: z.object({
        clerkId: z.string().min(1, 'Invalid clerk ID'),
        page: z.number().int().min(1, 'Invalid page: must be a positive integer').default(1),
        pageSize: z.number().int().min(1, 'Invalid pageSize: must be a positive integer').default(10),
        filters: z
            .object({
                name: z.string().optional(),
                minRadius: z.number().min(0, 'Invalid minRadius: must be a non-negative number').optional(),
                maxRadius: z.number().positive('Invalid maxRadius: must be a positive number').optional(),
            })
            .refine((data) => !data.minRadius || !data.maxRadius || data.minRadius <= data.maxRadius, {
                message: 'Invalid range: minRadius cannot be greater than maxRadius',
            })
            .optional(),
    }),
    geofenceId: z.string().min(1, 'Invalid geofence ID'),
    updateGeofence: z.object({
        clerkId: z.string().min(1, 'Invalid clerk ID'),
        geofenceId: z.string().min(1, 'Invalid geofence ID'),
        data: z.object({
            name: z.string().min(1, 'Invalid name: must be a non-empty string').optional(),
            geoJson: z
                .object({
                    type: z.literal('Point', 'Invalid geoJson: must be a Point object'),
                    coordinates: z.tuple([
                        z.number().min(-180, 'Invalid longitude: must be between -180 and 180').max(180),
                        z.number().min(-90, 'Invalid latitude: must be between -90 and 90').max(90),
                    ]),
                    radius: z.number().positive('Invalid radius: must be a positive number'),
                })
                .optional(),
        }),
    }),
};

// Custom Error
class GeofenceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GeofenceError';
    }
}

// Utility Functions
function handleError(error: unknown, context: string): never {
    const errorMsg =
        error instanceof z.ZodError
            ? error.errors.map((e) => e.message).join(', ')
            : error instanceof Error
              ? error.message
              : String(error);
    console.error(`${context} error: ${errorMsg}`);
    throw new GeofenceError(`Failed to ${context}: ${errorMsg}`);
}

async function checkUserAuthorization(
    clerkId: string,
    roleRequired: Role | Role[],
    ownerId?: string,
): Promise<{ user: any; owner?: any }> {
    const user = await db.user.findUnique({ where: { clerkId }, include: { owner: true } });
    if (!user) throw new GeofenceError('User not found');

    const roles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!roles.includes(user.role)) throw new GeofenceError('User role not authorized');

    if (user.role === Role.OWNER && !user.owner) throw new GeofenceError('User is not an owner');
    if (ownerId && user.role === Role.OWNER && user.owner?.id !== ownerId) {
        throw new GeofenceError('User does not own this geofence');
    }

    return { user, owner: user.owner };
}

function formatGeofence(geofence: any): Geofence {
    return {
        id: geofence.id,
        ownerId: geofence.ownerId,
        name: geofence.name,
        geoJson: geofence.geoJson,
        createdAt: geofence.createdAt.toISOString(),
    };
}

async function setTile38Geofence(geofence: {
    id: string;
    geoJson: { type: string; coordinates: [number, number]; radius: number };
}) {
    try {
        const hookName = `geofence${geofence.id}`;
        const [longitude, latitude] = geofence.geoJson.coordinates;
        const radius = geofence.geoJson.radius;
        await tile38
            .setHook(hookName, config.WEBHOOK_URL)
            .meta({ secret: config.TILE38_WEBHOOK_SECRET })
            .nearby('fleet')
            .detect(['enter', 'exit'] as any)
            .point(latitude, longitude, radius)
            .exec();
        console.log(`Set Tile38 geofence: ${hookName} (ID: ${geofence.id})`);
    } catch (error) {
        handleError(error, `setTile38Geofence for geofence ${geofence.id}`);
    }
}

async function deleteTile38Geofence(geofenceId: string) {
    try {
        const hookName = `geofence${geofenceId}`;
        await tile38.delHook(hookName);
        console.log(`Deleted Tile38 geofence: ${hookName} (ID: ${geofenceId})`);
    } catch (error) {
        handleError(error, `deleteTile38Geofence for geofence ${geofenceId}`);
    }
}

// Save Geofence
export async function saveGeofence(
    clerkId: string,
    {
        name,
        coordinates,
        radius,
    }: { name: string; coordinates: { latitude: number; longitude: number }; radius: number },
): Promise<Geofence> {
    try {
        const validatedData = schemas.saveGeofence.parse({ clerkId, name, coordinates, radius });
        const { owner } = await checkUserAuthorization(clerkId, Role.OWNER);

        const geofence = await db.geofence.create({
            data: {
                ownerId: owner.id,
                name: validatedData.name,
                geoJson: {
                    type: 'Point',
                    coordinates: [validatedData.coordinates.longitude, validatedData.coordinates.latitude],
                    radius: validatedData.radius,
                },
                h3Index: 'some_h3_index', // Replace with actual H3 index calculation
                resolution: 9,
                color: '#000000',
            },
        });

        await setTile38Geofence({ id: geofence.id, geoJson: geofence.geoJson });
        return formatGeofence(geofence);
    } catch (error) {
        handleError(error, 'saveGeofence');
    }
}

// Get Geofences
export async function getGeofences({
    clerkId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    clerkId: string;
    page?: number;
    pageSize?: number;
    filters?: { name?: string; minRadius?: number; maxRadius?: number };
}): Promise<{ geofences: Geofence[]; total: number }> {
    try {
        const validatedData = schemas.getGeofences.parse({ clerkId, page, pageSize, filters });
        const { user, owner } = await checkUserAuthorization(clerkId, [Role.OWNER, Role.PASSENGER, Role.DRIVER]);

        const where =
            user.role === Role.OWNER && owner
                ? {
                      ownerId: owner.id,
                      ...(validatedData.filters.name && {
                          name: { contains: validatedData.filters.name, mode: 'insensitive' },
                      }),
                  }
                : {
                      ...(validatedData.filters.name && {
                          name: { contains: validatedData.filters.name, mode: 'insensitive' },
                      }),
                  };

        const [geofences, total] = await Promise.all([
            db.geofence.findMany({
                where,
                skip: (validatedData.page - 1) * validatedData.pageSize,
                take: validatedData.pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.geofence.count({ where }),
        ]);

        return { geofences: geofences.map(formatGeofence), total };
    } catch (error) {
        handleError(error, 'getGeofences');
    }
}

// Get Geofence by ID
export async function getGeofenceById(clerkId: string, geofenceId: string): Promise<Geofence> {
    try {
        const validatedData = schemas.geofenceId.parse(geofenceId);
        const { user, owner } = await checkUserAuthorization(clerkId, [Role.OWNER, Role.PASSENGER, Role.DRIVER]);

        const geofence = await db.geofence.findUnique({ where: { id: validatedData } });
        if (!geofence) throw new GeofenceError('Geofence not found');

        if (user.role === Role.OWNER && owner && geofence.ownerId !== owner.id) {
            throw new GeofenceError('User does not own this geofence');
        }

        return formatGeofence(geofence);
    } catch (error) {
        handleError(error, 'getGeofenceById');
    }
}

// Update Geofence
export async function updateGeofence(
    clerkId: string,
    geofenceId: string,
    data: Partial<{
        name: string;
        geoJson: { type: string; coordinates: [number, number]; radius: number };
    }>,
): Promise<Geofence> {
    try {
        const validatedData = schemas.updateGeofence.parse({ clerkId, geofenceId, data });
        const { owner } = await checkUserAuthorization(clerkId, Role.OWNER);

        const geofence = await db.geofence.findUnique({ where: { id: validatedData.geofenceId } });
        if (!geofence) throw new GeofenceError('Geofence not found');
        if (geofence.ownerId !== owner.id) throw new GeofenceError('User does not own this geofence');

        const updatedGeofence = await db.geofence.update({
            where: { id: validatedData.geofenceId },
            data: {
                name: validatedData.data.name ?? undefined,
                geoJson: validatedData.data.geoJson ?? undefined,
            },
        });

        await setTile38Geofence({ id: updatedGeofence.id, geoJson: updatedGeofence.geoJson });
        return formatGeofence(updatedGeofence);
    } catch (error) {
        handleError(error, 'updateGeofence');
    }
}

// Delete Geofence
export async function deleteGeofence(clerkId: string, geofenceId: string): Promise<void> {
    try {
        const validatedData = schemas.geofenceId.parse(geofenceId);
        const { owner } = await checkUserAuthorization(clerkId, Role.OWNER);

        const geofence = await db.geofence.findUnique({ where: { id: validatedData } });
        if (!geofence) throw new GeofenceError('Geofence not found');
        if (geofence.ownerId !== owner.id) throw new GeofenceError('User does not own this geofence');

        await deleteTile38Geofence(geofenceId);
        await db.geofence.delete({ where: { id: validatedData } });
    } catch (error) {
        handleError(error, 'deleteGeofence');
    }
}
