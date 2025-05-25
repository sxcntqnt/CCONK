'use server';

import { db } from '@/lib/prisma';
import { Role } from '@/utils';
import { Tile38 } from '@iwpnd/tile38-ts';

interface Geofence {
    id: string;
    ownerId: string | null;
    name: string;
    geoJson: { type: string; coordinates: [number, number]; radius: number };
    createdAt: string;
}

const TILE38_HOST = process.env.TILE38_HOST || 'localhost:9851';
const WEBHOOK_URL = process.env.GEOFENCE_WEBHOOK_URL || 'http://localhost:3000/api/geofence-webhook';
const TILE38_WEBHOOK_SECRET = process.env.TILE38_WEBHOOK_SECRET || '';

if (!TILE38_WEBHOOK_SECRET) {
    throw new Error('TILE38_WEBHOOK_SECRET is not set in environment variables');
}

// Initialize Tile38 client
const tile38 = new Tile38(TILE38_HOST);

// Log Tile38 connection events
tile38.on('connect', () => console.log('Connected to Tile38'));
tile38.on('error', (err) => console.error(`Tile38 error: ${err}`));

// Helper function to set a Tile38 geofence
async function setTile38Geofence(geofence: {
    id: string;
    geoJson: { type: string; coordinates: [number, number]; radius: number };
}) {
    try {
        const hookName = `geofence${geofence.id}`;
        const [longitude, latitude] = geofence.geoJson.coordinates;
        const radius = geofence.geoJson.radius;
        await tile38
            .setHook(hookName, WEBHOOK_URL)
            .meta({ secret: TILE38_WEBHOOK_SECRET })
            .nearby('fleet')
            .detect(['enter', 'exit'] as any) // Replace with proper Detect type
            .point(latitude, longitude, radius)
            .exec();
        console.log(`Set Tile38 geofence: ${hookName} (ID: ${geofence.id})`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`setTile38Geofence error for geofence ${geofence.id}: ${errorMsg}`);
        throw new Error(`Failed to set Tile38 geofence: ${errorMsg}`);
    }
}

// Helper function to delete a Tile38 geofence
async function deleteTile38Geofence(geofenceId: string) {
    try {
        const hookName = `geofence${geofenceId}`;
        await tile38.delHook(hookName);
        console.log(`Deleted Tile38 geofence: ${hookName} (ID: ${geofenceId})`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`deleteTile38Geofence error for geofence ${geofenceId}: ${errorMsg}`);
        throw new Error(`Failed to delete Tile38 geofence: ${errorMsg}`);
    }
}

export async function saveGeofence(
    clerkId: string,
    {
        name,
        coordinates,
        radius,
    }: {
        name: string;
        coordinates: { latitude: number; longitude: number };
        radius: number;
    },
): Promise<Geofence> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new Error('Invalid name: must be a non-empty string');
        }
        if (!coordinates || typeof coordinates !== 'object') {
            throw new Error('Invalid coordinates: must be an object with latitude and longitude');
        }
        if (!Number.isFinite(coordinates.latitude) || coordinates.latitude < -90 || coordinates.latitude > 90) {
            throw new Error('Invalid latitude: must be between -90 and 90');
        }
        if (!Number.isFinite(coordinates.longitude) || coordinates.longitude < -180 || coordinates.longitude > 180) {
            throw new Error('Invalid longitude: must be between -180 and 180');
        }
        if (!Number.isFinite(radius) || radius <= 0) {
            throw new Error('Invalid radius: must be a positive number');
        }

        // Check if user is an OWNER
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user || user.role !== Role.OWNER || !user.owner) {
            throw new Error('User is not authorized to save geofences');
        }

        // Create new geofence in Prisma
        const geofence = await db.geofence.create({
            data: {
                ownerId: user.owner.id,
                name,
                geoJson: {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude],
                    radius,
                },
                h3Index: 'some_h3_index', // Replace with actual H3 index calculation
                resolution: 9, // Replace with appropriate resolution
                color: '#000000', // Default color
            },
        });

        // Sync with Tile38
        await setTile38Geofence({ id: geofence.id, geoJson: geofence.geoJson });

        return {
            id: geofence.id,
            ownerId: geofence.ownerId,
            name: geofence.name,
            geoJson: geofence.geoJson,
            createdAt: geofence.createdAt.toISOString(),
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`saveGeofence error: ${errorMsg}`);
        throw new Error(`Failed to save geofence: ${errorMsg}`);
    }
}

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
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        if (filters.minRadius != null && (!Number.isFinite(filters.minRadius) || filters.minRadius < 0)) {
            throw new Error('Invalid minRadius: must be a non-negative number');
        }
        if (filters.maxRadius != null && (!Number.isFinite(filters.maxRadius) || filters.maxRadius <= 0)) {
            throw new Error('Invalid maxRadius: must be a positive number');
        }
        if (filters.minRadius != null && filters.maxRadius != null && filters.minRadius > filters.maxRadius) {
            throw new Error('Invalid range: minRadius cannot be greater than maxRadius');
        }

        // Check if user exists and has a valid role
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (![Role.OWNER, Role.PASSENGER, Role.DRIVER].includes(user.role)) {
            throw new Error('User role not authorized to access geofences');
        }

        let where = {};
        if (user.role === Role.OWNER && user.owner) {
            where = {
                ownerId: user.owner.id,
                ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' as const } }),
                // Note: Filtering on geoJson.radius requires raw SQL or client-side filtering
            };
        } else {
            where = {
                ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' as const } }),
            };
        }

        const [geofences, total] = await Promise.all([
            db.geofence.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.geofence.count({ where }),
        ]);

        const formattedGeofences: Geofence[] = geofences.map((geofence) => ({
            id: geofence.id,
            ownerId: geofence.ownerId,
            name: geofence.name,
            geoJson: geofence.geoJson,
            createdAt: geofence.createdAt.toISOString(),
        }));

        return { geofences: formattedGeofences, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getGeofences error: ${errorMsg}`);
        throw new Error(`Failed to fetch geofences: ${errorMsg}`);
    }
}

export async function getGeofenceById(clerkId: string, geofenceId: string): Promise<Geofence> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        if (!geofenceId || typeof geofenceId !== 'string') {
            throw new Error('Invalid geofence ID');
        }

        // Check if user exists and has a valid role
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (![Role.OWNER, Role.PASSENGER, Role.DRIVER].includes(user.role)) {
            throw new Error('User role not authorized to access geofences');
        }

        // Fetch geofence
        const geofence = await db.geofence.findUnique({
            where: { id: geofenceId },
        });

        if (!geofence) {
            throw new Error('Geofence not found');
        }

        if (user.role === Role.OWNER && user.owner && geofence.ownerId !== user.owner.id) {
            throw new Error('User does not own this geofence');
        }

        return {
            id: geofence.id,
            ownerId: geofence.ownerId,
            name: geofence.name,
            geoJson: geofence.geoJson,
            createdAt: geofence.createdAt.toISOString(),
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getGeofenceById error: ${errorMsg}`);
        throw new Error(`Failed to fetch geofence: ${errorMsg}`);
    }
}

export async function updateGeofence(
    clerkId: string,
    geofenceId: string,
    data: Partial<{
        name: string;
        geoJson: { type: string; coordinates: [number, number]; radius: number };
    }>,
): Promise<Geofence> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        if (!geofenceId || typeof geofenceId !== 'string') {
            throw new Error('Invalid geofence ID');
        }
        if (data.name != null && (typeof data.name !== 'string' || !data.name.trim())) {
            throw new Error('Invalid name: must be a non-empty string');
        }
        if (data.geoJson != null) {
            if (typeof data.geoJson !== 'object' || data.geoJson.type !== 'Point') {
                throw new Error('Invalid geoJson: must be a Point object');
            }
            const [longitude, latitude] = data.geoJson.coordinates;
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
                throw new Error('Invalid latitude: must be between -90 and 90');
            }
            if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                throw new Error('Invalid longitude: must be between -180 and 180');
            }
            if (!Number.isFinite(data.geoJson.radius) || data.geoJson.radius <= 0) {
                throw new Error('Invalid radius: must be a positive number');
            }
        }

        // Check if user is an OWNER
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user || user.role !== Role.OWNER || !user.owner) {
            throw new Error('User is not authorized to update geofences');
        }

        // Fetch geofence to verify ownership
        const geofence = await db.geofence.findUnique({
            where: { id: geofenceId },
        });

        if (!geofence) {
            throw new Error('Geofence not found');
        }

        if (geofence.ownerId !== user.owner.id) {
            throw new Error('User does not own this geofence');
        }

        // Update geofence in Prisma
        const updatedGeofence = await db.geofence.update({
            where: { id: geofenceId },
            data: {
                name: data.name ?? undefined,
                geoJson: data.geoJson ?? undefined,
            },
        });

        // Sync with Tile38
        await setTile38Geofence({ id: updatedGeofence.id, geoJson: updatedGeofence.geoJson });

        return {
            id: updatedGeofence.id,
            ownerId: updatedGeofence.ownerId,
            name: updatedGeofence.name,
            geoJson: updatedGeofence.geoJson,
            createdAt: updatedGeofence.createdAt.toISOString(),
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`updateGeofence error: ${errorMsg}`);
        throw new Error(`Failed to update geofence: ${errorMsg}`);
    }
}

export async function deleteGeofence(clerkId: string, geofenceId: string): Promise<void> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        if (!geofenceId || typeof geofenceId !== 'string') {
            throw new Error('Invalid geofence ID');
        }

        // Check if user is an OWNER
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user || user.role !== Role.OWNER || !user.owner) {
            throw new Error('User is not authorized to delete geofences');
        }

        // Fetch geofence to verify ownership
        const geofence = await db.geofence.findUnique({
            where: { id: geofenceId },
        });

        if (!geofence) {
            throw new Error('Geofence not found');
        }

        if (geofence.ownerId !== user.owner.id) {
            throw new Error('User does not own this geofence');
        }

        // Delete geofence from Tile38
        await deleteTile38Geofence(geofenceId);

        // Delete geofence from Prisma
        await db.geofence.delete({
            where: { id: geofenceId },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`deleteGeofence error: ${errorMsg}`);
        throw new Error(`Failed to delete geofence: ${errorMsg}`);
    }
}
