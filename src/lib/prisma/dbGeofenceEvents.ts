'use server';

import { db } from '@/lib/prisma';
import { GeofenceEvent } from './dbTypes';
import { Tile38 } from '@iwpnd/tile38-ts';
import { Svix } from 'svix';
import { Role } from '@/utils';

const VALID_EVENTS = ['ENTER', 'EXIT'] as const;
const TILE38_HOST = process.env.TILE38_HOST || 'localhost:9851';
const WEBHOOK_URL = process.env.GEOFENCE_WEBHOOK_URL || 'http://localhost:3000/api/geofence-webhook';
const SVIX_AUTH_TOKEN = process.env.SVIX_AUTH_TOKEN;
const TILE38_WEBHOOK_SECRET = process.env.TILE38_WEBHOOK_SECRET || '';

if (!SVIX_AUTH_TOKEN) {
    throw new Error('SVIX_AUTH_TOKEN is not set in environment variables');
}
if (!TILE38_WEBHOOK_SECRET) {
    throw new Error('TILE38_WEBHOOK_SECRET is not set in environment variables');
}

const svix = new Svix(SVIX_AUTH_TOKEN);

export async function saveGeofenceEvent({
    busId,
    geofenceId,
    event,
}: {
    busId: string;
    geofenceId: string;
    event: string;
}): Promise<GeofenceEvent> {
    try {
        // Validate inputs
        if (!busId || typeof busId !== 'string') {
            throw new Error('Invalid bus ID');
        }
        if (!geofenceId || typeof geofenceId !== 'string') {
            throw new Error('Invalid geofence ID');
        }
        if (!event || typeof event !== 'string' || !VALID_EVENTS.includes(event as any)) {
            throw new Error(`Invalid event: must be one of ${VALID_EVENTS.join(', ')}`);
        }

        // Verify bus exists
        const bus = await db.bus.findUnique({
            where: { id: busId },
            select: { id: true, licensePlate: true, ownerId: true, driverId: true },
        });
        if (!bus) {
            throw new Error(`Bus with ID ${busId} not found`);
        }

        // Verify geofence exists
        const geofence = await db.geofence.findUnique({
            where: { id: geofenceId },
            select: { id: true, name: true },
        });
        if (!geofence) {
            throw new Error(`Geofence with ID ${geofenceId} not found`);
        }

        // Create geofence event
        const geofenceEvent = await db.geofenceEvent.create({
            data: {
                busId,
                geofenceId,
                event,
                timestamp: new Date(),
            },
            include: {
                bus: { select: { id: true, licensePlate: true, ownerId: true, driverId: true } },
                geofence: { select: { id: true, name: true } },
            },
        });

        // Prepare webhook payload
        const payload = {
            eventType: `geofence.${event.toLowerCase()}`,
            data: {
                id: geofenceEvent.id,
                busId: geofenceEvent.busId,
                geofenceId: geofenceEvent.geofenceId,
                event: geofenceEvent.event,
                timestamp: geofenceEvent.timestamp.toISOString(),
                bus: {
                    id: geofenceEvent.bus.id,
                    licensePlate: geofenceEvent.bus.licensePlate,
                },
                geofence: {
                    id: geofenceEvent.geofence.id,
                    name: geofenceEvent.geofence.name,
                },
            },
        };

        // Send webhook to subscribed endpoints via Svix
        try {
            // Find all users who should receive this event
            const owner = bus.ownerId
                ? await db.owner.findUnique({
                      where: { id: bus.ownerId },
                      include: { user: true },
                  })
                : null;
            const passengers = await db.passenger.findMany({
                where: { bus: { id: busId } },
                include: { user: true },
            });
            const driver = bus.driverId
                ? await db.driver.findUnique({
                      where: { id: bus.driverId },
                      include: { user: true },
                  })
                : null;

            const users = [owner?.user, ...(passengers.map((p) => p.user) || []), driver?.user].filter(
                (u): u is NonNullable<typeof u> => !!u,
            );

            for (const user of users) {
                const appId = `user_${user.clerkId}`;
                try {
                    await svix.message.create(appId, {
                        eventType: payload.eventType,
                        payload,
                        eventId: `geofence_event_${geofenceEvent.id}`,
                    });
                } catch (error) {
                    console.error(`Failed to send Svix webhook for user ${user.clerkId}:`, error);
                    // Continue with other users
                }
            }
        } catch (error) {
            console.error('Failed to send Svix webhooks:', error);
            // Don't fail the event save; log and continue
        }

        return {
            id: geofenceEvent.id,
            busId: geofenceEvent.busId,
            geofenceId: geofenceEvent.geofenceId,
            event: geofenceEvent.event,
            timestamp: geofenceEvent.timestamp.toISOString(),
            createdAt: geofenceEvent.createdAt.toISOString(),
            bus: {
                id: geofenceEvent.bus.id,
                licensePlate: geofenceEvent.bus.licensePlate,
            },
            geofence: {
                id: geofenceEvent.geofence.id,
                name: geofenceEvent.geofence.name,
            },
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`saveGeofenceEvent error: ${errorMsg}`);
        throw new Error(`Failed to save geofence event: ${errorMsg}`);
    }
}

export async function getGeofenceEvents({
    clerkId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    clerkId: string;
    page?: number;
    pageSize?: number;
    filters?: { busId?: string; geofenceId?: string; event?: string };
}): Promise<{ geofenceEvents: GeofenceEvent[]; total: number }> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        if (filters.busId != null && typeof filters.busId !== 'string') {
            throw new Error('Invalid bus ID');
        }
        if (filters.geofenceId != null && typeof filters.geofenceId !== 'string') {
            throw new Error('Invalid geofence ID');
        }
        if (filters.event != null && !VALID_EVENTS.includes(filters.event as any)) {
            throw new Error(`Invalid event filter: must be one of ${VALID_EVENTS.join(', ')}`);
        }

        // Fetch user with role and relations
        const user = await db.user.findUnique({
            where: { clerkId },
            include: {
                owner: true,
                passenger: true,
                driver: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        let where = {};

        if (user.role === Role.OWNER && user.owner) {
            where = {
                bus: { ownerId: user.owner.id },
                ...(filters.busId && filters.busId && { busId: filters.busId }),
                ...(filters.geofenceId && { geofenceId: filters.geofenceId }),
                ...(filters.event && { event: filters.event }),
            };
        } else if (user.role === Role.PASSENGER && user.passenger) {
            const passengerBuses = await db.passenger.findUnique({
                where: { userId: user.id },
                select: { bus: { select: { id: true } } },
            });
            const busIds = passengerBuses?.bus ? [passengerBuses.bus.id] : [];
            if (busIds.length === 0) {
                return { geofenceEvents: [], total: 0 };
            }
            where = {
                busId: { in: busIds },
                ...(filters.busId && busIds.includes(filters.busId) && { busId: filters.busId }),
                ...(filters.geofenceId && { geofenceId: filters.geofenceId }),
                ...(filters.event && { event: filters.event }),
            };
        } else if (user.role === Role.DRIVER && user.driver) {
            const driverBuses = await db.bus.findMany({
                where: { driverId: user.driver.id },
                select: { id: true },
            });
            const busIds = driverBuses.map((bus) => bus.id);
            if (busIds.length === 0) {
                return { geofenceEvents: [], total: 0 };
            }
            where = {
                busId: { in: busIds },
                ...(filters.busId && busIds.includes(filters.busId) && { busId: filters.busId }),
                ...(filters.geofenceId && { geofenceId: filters.geofenceId }),
                ...(filters.event && { event: filters.event }),
            };
        } else {
            throw new Error('User role not authorized to access geofence events');
        }

        const [geofenceEvents, total] = await Promise.all([
            db.geofenceEvent.findMany({
                where,
                include: {
                    bus: { select: { id: true, licensePlate: true, ownerId: true, driverId: true } },
                    geofence: { select: { id: true, name: true } },
                },
                skip,
                take: pageSize,
                orderBy: { timestamp: 'desc' },
            }),
            db.geofenceEvent.count({ where }),
        ]);

        const formattedGeofenceEvents: GeofenceEvent[] = geofenceEvents.map((event) => ({
            id: event.id,
            busId: event.busId,
            geofenceId: event.geofenceId,
            event: event.event,
            timestamp: event.timestamp.toISOString(),
            createdAt: event.createdAt.toISOString(),
            bus: {
                id: event.bus.id,
                licensePlate: event.bus.licensePlate,
            },
            geofence: {
                id: event.geofence.id,
                name: event.geofence.name,
            },
        }));

        return { geofenceEvents: formattedGeofenceEvents, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getGeofenceEvents error: ${errorMsg}`);
        throw new Error(`Failed to fetch geofence events: ${errorMsg}`);
    }
}

export async function getGeofenceEventById(clerkId: string, eventId: string): Promise<GeofenceEvent> {
    try {
        // Validate inputs
        if (!clerkId || typeof clerkId !== 'string') {
            throw new Error('Invalid clerk ID');
        }
        if (!eventId || typeof eventId !== 'string') {
            throw new Error('Invalid geofence event ID');
        }

        // Fetch user with role and relations
        const user = await db.user.findUnique({
            where: { clerkId },
            include: {
                owner: true,
                passenger: true,
                driver: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Fetch geofence event
        const geofenceEvent = await db.geofenceEvent.findUnique({
            where: { id: eventId },
            include: {
                bus: { select: { id: true, licensePlate: true, ownerId: true, driverId: true } },
                geofence: { select: { id: true, name: true } },
            },
        });

        if (!geofenceEvent) {
            throw new Error('Geofence event not found');
        }

        // Authorize based on role
        if (user.role === Role.OWNER && user.owner) {
            if (geofenceEvent.bus.ownerId !== user.owner.id) {
                throw new Error('User does not own the bus associated with this geofence event');
            }
        } else if (user.role === Role.PASSENGER && user.passenger) {
            const passengerBuses = await db.passenger.findUnique({
                where: { userId: user.id },
                select: { bus: { select: { id: true } } },
            });
            const busIds = passengerBuses?.bus ? [passengerBuses.bus.id] : [];
            if (!busIds.includes(geofenceEvent.busId)) {
                throw new Error('User is not associated with the bus for this geofence event');
            }
        } else if (user.role === Role.DRIVER && user.driver) {
            if (geofenceEvent.bus.driverId !== user.driver.id) {
                throw new Error('User is not assigned to the bus for this geofence event');
            }
        } else {
            throw new Error('User role not authorized to access geofence events');
        }

        return {
            id: geofenceEvent.id,
            busId: geofenceEvent.busId,
            geofenceId: geofenceEvent.geofenceId,
            event: geofenceEvent.event,
            timestamp: geofenceEvent.timestamp.toISOString(),
            createdAt: geofenceEvent.createdAt.toISOString(),
            bus: {
                id: geofenceEvent.bus.id,
                licensePlate: geofenceEvent.bus.licensePlate,
            },
            geofence: {
                id: geofenceEvent.geofence.id,
                name: geofenceEvent.geofence.name,
            },
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getGeofenceEventById error: ${errorMsg}`);
        throw new Error(`Failed to fetch geofence event: ${errorMsg}`);
    }
}

export async function initializeTile38Geofences() {
    try {
        // Initialize Tile38 client
        const tile38 = new Tile38(TILE38_HOST);
        tile38.on('connect', () => console.log('Connected to Tile38'));
        tile38.on('error', (err) => console.error(`Tile38 error: ${err}`));

        // Fetch all geofences from Prisma
        const geofences = await db.geofence.findMany({
            select: {
                id: true,
                name: true,
                geoJson: true,
            },
        });

        // Set up geofences in Tile38
        for (const geofence of geofences) {
            const hookName = `geofence${geofence.id}`;
            const geoJson = geofence.geoJson as { type: string; coordinates: [number, number]; radius?: number };
            const [longitude, latitude] = geoJson.coordinates;
            const radius = geoJson.radius || 100;
            await tile38
                .setHook(hookName, WEBHOOK_URL)
                .meta({ secret: TILE38_WEBHOOK_SECRET })
                .nearby('fleet')
                .detect(['enter', 'exit'] as any) // Replace with proper Detect type
                .point(latitude, longitude, radius)
                .exec();
            console.log(`Set up Tile38 geofence: ${hookName} (ID: ${geofence.id})`);
        }

        return { ok: true, count: geofences.length };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`initializeTile38Geofences error: ${errorMsg}`);
        throw new Error(`Failed to initialize Tile38 geofences: ${errorMsg}`);
    }
}
