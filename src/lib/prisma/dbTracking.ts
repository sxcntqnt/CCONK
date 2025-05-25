'use server';

import { db } from '@/lib/prisma';
import { Prisma, TripStatus } from '@prisma/client';
import { z } from 'zod';
import { Tracking } from '@/utils/constants/types';
import { ROLES } from '@/utils/constants/roles';
import { TrackingWithRelations } from './dbTypes';

// Validation Schemas
const saveTrackingSchema = z.object({
    busId: z.string().min(1, 'Bus ID is required'),
    tripId: z.string().min(1, 'Trip ID is required').optional(),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180),
    altitude: z.number().optional().nullable(),
    speed: z.number().min(0, 'Speed must be non-negative').optional().nullable(),
    bearing: z.number().min(0, 'Bearing must be between 0 and 360').max(360).optional().nullable(),
    accuracy: z.number().min(0, 'Accuracy must be non-negative').optional().nullable(),
    provider: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
    geofenceEvent: z
        .object({
            geofenceId: z.string().min(1, 'Geofence ID is required'),
            event: z.string().min(1, 'Event type is required'),
        })
        .optional(),
});

const getTrackingRecordsSchema = z.object({
    ownerId: z.string().min(1, 'Owner ID is required'),
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
    filters: z
        .object({
            busId: z.string().min(1).optional(),
            tripId: z.string().min(1).optional(),
            licensePlate: z.string().optional(),
            time: z.string().datetime().optional(),
            geofenceId: z.string().min(1).optional(),
        })
        .optional()
        .default({}),
});

const updateTrackingSchema = z.object({
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90).optional(),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180).optional(),
    altitude: z.number().optional().nullable(),
    speed: z.number().min(0, 'Speed must be non-negative').optional().nullable(),
    bearing: z.number().min(0, 'Bearing must be between 0 and 360').max(360).optional().nullable(),
    accuracy: z.number().min(0, 'Accuracy must be non-negative').optional().nullable(),
    provider: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
    tripId: z.string().min(1, 'Trip ID is required').optional().nullable(),
    geofenceEvent: z
        .object({
            geofenceId: z.string().min(1, 'Geofence ID is required'),
            event: z.string().min(1, 'Event type is required'),
        })
        .optional(),
});

// Custom Error
class TrackingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TrackingError';
    }
}

export async function saveTracking(
    clerkId: string,
    data: {
        busId: string;
        tripId?: string;
        latitude: number;
        longitude: number;
        altitude?: number | null;
        speed?: number | null;
        bearing?: number | null;
        accuracy?: number | null;
        provider?: string | null;
        comment?: string | null;
        geofenceEvent?: { geofenceId: string; event: string };
    },
): Promise<Tracking> {
    try {
        const validatedData = saveTrackingSchema.parse(data);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: {
                owner: {
                    include: {
                        buses: { select: { id: true } },
                        geofences: { select: { id: true } },
                    },
                },
            },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new TrackingError('User is not authorized to save tracking data');
        }

        const busIds = user.owner.buses.map((bus: { id: string }) => bus.id);
        if (!busIds.includes(validatedData.busId)) {
            throw new TrackingError('User does not own the specified bus');
        }

        // Validate tripId if provided
        if (validatedData.tripId) {
            const trip = await db.trip.findUnique({
                where: { id: validatedData.tripId },
                include: { bus: { select: { ownerId: true } } },
            });
            if (!trip || trip.bus.ownerId !== user.owner.id || trip.busId !== validatedData.busId) {
                throw new TrackingError('Invalid or unauthorized trip ID');
            }
        }

        // Validate geofenceId if provided
        if (validatedData.geofenceEvent) {
            const geofenceIds = user.owner.geofences.map((geofence: { id: string }) => geofence.id);
            if (!geofenceIds.includes(validatedData.geofenceEvent.geofenceId)) {
                throw new TrackingError('Invalid or unauthorized geofence ID');
            }
        }

        const now = new Date();
        const tracking = await db.tracking.create({
            data: {
                busId: validatedData.busId,
                tripId: validatedData.tripId,
                time: now,
                latitude: validatedData.latitude,
                longitude: validatedData.longitude,
                altitude: validatedData.altitude,
                speed: validatedData.speed,
                bearing: validatedData.bearing,
                accuracy: validatedData.accuracy,
                provider: validatedData.provider,
                comment: validatedData.comment,
                createdAt: now,
                geofenceEvents: validatedData.geofenceEvent
                    ? {
                          create: {
                              busId: validatedData.busId,
                              geofenceId: validatedData.geofenceEvent.geofenceId,
                              event: validatedData.geofenceEvent.event,
                              timestamp: now,
                              createdAt: now,
                              updatedAt: now,
                          },
                      }
                    : undefined,
            },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        model: true,
                        category: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                trip: {
                    select: {
                        id: true,
                        busId: true,
                        routeId: true,
                        destinationIndex: true,
                        departureTime: true,
                        arrivalTime: true,
                        status: true,
                        isFullyBooked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                geofenceEvents: {
                    select: {
                        id: true,
                        busId: true,
                        geofenceId: true,
                        event: true,
                        timestamp: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return {
            id: tracking.id,
            busId: tracking.busId,
            tripId: tracking.tripId ?? undefined,
            time: tracking.time,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            altitude: tracking.altitude ?? undefined,
            speed: tracking.speed ?? undefined,
            bearing: tracking.bearing ?? undefined,
            accuracy: tracking.accuracy ?? undefined,
            provider: tracking.provider ?? undefined,
            comment: tracking.comment ?? undefined,
            createdAt: tracking.createdAt,
            bus: {
                id: tracking.bus.id,
                licensePlate: tracking.bus.licensePlate,
            },
            trip: tracking.trip
                ? {
                      id: tracking.trip.id,
                      busId: tracking.trip.busId,
                      routeId: tracking.trip.routeId,
                      destinationIndex: tracking.trip.destinationIndex,
                      departureTime: tracking.trip.departureTime,
                      arrivalTime: tracking.trip.arrivalTime ?? undefined,
                      status: tracking.trip.status,
                      isFullyBooked: tracking.trip.isFullyBooked,
                      createdAt: tracking.trip.createdAt,
                      updatedAt: tracking.trip.updatedAt,
                  }
                : undefined,
            geofenceEvents: tracking.geofenceEvents.map((event) => ({
                id: event.id,
                busId: event.busId,
                geofenceId: event.geofenceId,
                event: event.event,
                timestamp: event.timestamp,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
                bus: { id: tracking.bus.id, licensePlate: tracking.bus.licensePlate },
                geofence: { id: event.geofenceId, name: '' }, // Name requires additional query if needed
            })),
        };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`saveTracking error: ${errorMsg}`);
        throw new TrackingError(`Failed to save tracking: ${errorMsg}`);
    }
}

export async function getTrackingRecords({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { busId?: string; tripId?: string; licensePlate?: string; time?: string; geofenceId?: string };
}): Promise<{ trackingRecords: Tracking[]; total: number }> {
    try {
        const validatedData = getTrackingRecordsSchema.parse({ ownerId, page, pageSize, filters });
        const { busId, tripId, licensePlate, time, geofenceId } = validatedData.filters;
        const skip = (validatedData.page - 1) * validatedData.pageSize;

        let timeFilter: Date | undefined;
        if (time) {
            timeFilter = new Date(time);
            if (isNaN(timeFilter.getTime())) {
                throw new TrackingError(`Invalid time format: ${time}`);
            }
        }

        const trackingRecords = await db.tracking.findMany({
            where: {
                bus: {
                    ownerId: validatedData.ownerId,
                    ...(busId && { id: busId }),
                    ...(licensePlate && { licensePlate: { contains: licensePlate, mode: 'insensitive' } }),
                },
                ...(tripId && { tripId }),
                ...(geofenceId && { geofenceEvents: { some: { geofenceId } } }),
                ...(timeFilter && {
                    time: {
                        gte: new Date(timeFilter.setHours(0, 0, 0, 0)),
                        lte: new Date(timeFilter.setHours(23, 59, 59, 999)),
                    },
                }),
            },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        model: true,
                        category: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                trip: {
                    select: {
                        id: true,
                        busId: true,
                        routeId: true,
                        destinationIndex: true,
                        departureTime: true,
                        arrivalTime: true,
                        status: true,
                        isFullyBooked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                geofenceEvents: {
                    select: {
                        id: true,
                        busId: true,
                        geofenceId: true,
                        event: true,
                        timestamp: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
            skip,
            take: validatedData.pageSize,
            orderBy: { time: 'desc' },
        });

        const total = await db.tracking.count({
            where: {
                bus: {
                    ownerId: validatedData.ownerId,
                    ...(busId && { id: busId }),
                    ...(licensePlate && { licensePlate: { contains: licensePlate, mode: 'insensitive' } }),
                },
                ...(tripId && { tripId }),
                ...(geofenceId && { geofenceEvents: { some: { geofenceId } } }),
                ...(timeFilter && {
                    time: {
                        gte: new Date(timeFilter.setHours(0, 0, 0, 0)),
                        lte: new Date(timeFilter.setHours(23, 59, 59, 999)),
                    },
                }),
            },
        });

        const formattedTrackingRecords: Tracking[] = trackingRecords.map((record) => ({
            id: record.id,
            busId: record.busId,
            tripId: record.tripId ?? undefined,
            time: record.time,
            latitude: record.latitude,
            longitude: record.longitude,
            altitude: record.altitude ?? undefined,
            speed: record.speed ?? undefined,
            bearing: record.bearing ?? undefined,
            accuracy: record.accuracy ?? undefined,
            provider: record.provider ?? undefined,
            comment: record.comment ?? undefined,
            createdAt: record.createdAt,
            bus: {
                id: record.bus.id,
                licensePlate: record.bus.licensePlate,
            },
            trip: record.trip
                ? {
                      id: record.trip.id,
                      busId: record.trip.busId,
                      routeId: record.trip.routeId,
                      destinationIndex: record.trip.destinationIndex,
                      departureTime: record.trip.departureTime,
                      arrivalTime: record.trip.arrivalTime ?? undefined,
                      status: record.trip.status,
                      isFullyBooked: record.trip.isFullyBooked,
                      createdAt: record.trip.createdAt,
                      updatedAt: record.trip.updatedAt,
                  }
                : undefined,
            geofenceEvents: record.geofenceEvents.map((event) => ({
                id: event.id,
                busId: event.busId,
                geofenceId: event.geofenceId,
                event: event.event,
                timestamp: event.timestamp,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
                bus: { id: record.bus.id, licensePlate: record.bus.licensePlate },
                geofence: { id: event.geofenceId, name: '' }, // Name requires additional query if needed
            })),
        }));

        return { trackingRecords: formattedTrackingRecords, total };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getTrackingRecords error: ${errorMsg}`);
        throw new TrackingError(`Failed to fetch tracking records: ${errorMsg}`);
    }
}

export async function getTrackingById(clerkId: string, trackingId: string): Promise<Tracking> {
    try {
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: { include: { buses: { select: { id: true } } } } },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new TrackingError('User is not authorized to access tracking data');
        }

        const tracking = await db.tracking.findUnique({
            where: { id: trackingId },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        model: true,
                        category: true,
                        createdAt: true,
                        updatedAt: true,
                        ownerId: true,
                    },
                },
                trip: {
                    select: {
                        id: true,
                        busId: true,
                        routeId: true,
                        destinationIndex: true,
                        departureTime: true,
                        arrivalTime: true,
                        status: true,
                        isFullyBooked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                geofenceEvents: {
                    select: {
                        id: true,
                        busId: true,
                        geofenceId: true,
                        event: true,
                        timestamp: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!tracking || tracking.bus.ownerId !== user.owner.id) {
            throw new TrackingError('Tracking record not found or user not authorized');
        }

        return {
            id: tracking.id,
            busId: tracking.busId,
            tripId: tracking.tripId ?? undefined,
            time: tracking.time,
            latitude: tracking.latitude,
            longitude: tracking.longitude,
            altitude: tracking.altitude ?? undefined,
            speed: tracking.speed ?? undefined,
            bearing: tracking.bearing ?? undefined,
            accuracy: tracking.accuracy ?? undefined,
            provider: tracking.provider ?? undefined,
            comment: tracking.comment ?? undefined,
            createdAt: tracking.createdAt,
            bus: {
                id: tracking.bus.id,
                licensePlate: tracking.bus.licensePlate,
            },
            trip: tracking.trip
                ? {
                      id: tracking.trip.id,
                      busId: tracking.trip.busId,
                      routeId: tracking.trip.routeId,
                      destinationIndex: tracking.trip.destinationIndex,
                      departureTime: tracking.trip.departureTime,
                      arrivalTime: tracking.trip.arrivalTime ?? undefined,
                      status: tracking.trip.status,
                      isFullyBooked: tracking.trip.isFullyBooked,
                      createdAt: tracking.trip.createdAt,
                      updatedAt: tracking.trip.updatedAt,
                  }
                : undefined,
            geofenceEvents: tracking.geofenceEvents.map((event) => ({
                id: event.id,
                busId: event.busId,
                geofenceId: event.geofenceId,
                event: event.event,
                timestamp: event.timestamp,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
                bus: { id: tracking.bus.id, licensePlate: tracking.bus.licensePlate },
                geofence: { id: event.geofenceId, name: '' }, // Name requires additional query if needed
            })),
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getTrackingById error: ${errorMsg}`);
        throw new TrackingError(`Failed to fetch tracking: ${errorMsg}`);
    }
}

export async function updateTracking(
    clerkId: string,
    trackingId: string,
    data: {
        latitude?: number;
        longitude?: number;
        altitude?: number | null;
        speed?: number | null;
        bearing?: number | null;
        accuracy?: number | null;
        provider?: string | null;
        comment?: string | null;
        tripId?: string | null;
        geofenceEvent?: { geofenceId: string; event: string };
    },
): Promise<Tracking> {
    try {
        const validatedData = updateTrackingSchema.parse(data);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: {
                owner: {
                    include: {
                        buses: { select: { id: true } },
                        geofences: { select: { id: true } },
                    },
                },
            },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new TrackingError('User is not authorized to update tracking data');
        }

        const tracking = await db.tracking.findUnique({
            where: { id: trackingId },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        model: true,
                        category: true,
                        createdAt: true,
                        updatedAt: true,
                        ownerId: true,
                    },
                },
            },
        });

        if (!tracking || tracking.bus.ownerId !== user.owner.id) {
            throw new TrackingError('Tracking record not found or user not authorized');
        }

        // Validate tripId if provided
        if (validatedData.tripId) {
            const trip = await db.trip.findUnique({
                where: { id: validatedData.tripId },
                include: { bus: { select: { ownerId: true } } },
            });
            if (!trip || trip.bus.ownerId !== user.owner.id || trip.busId !== tracking.busId) {
                throw new TrackingError('Invalid or unauthorized trip ID');
            }
        }

        // Validate geofenceId if provided
        if (validatedData.geofenceEvent) {
            const geofenceIds = user.owner.geofences.map((geofence: { id: string }) => geofence.id);
            if (!geofenceIds.includes(validatedData.geofenceEvent.geofenceId)) {
                throw new TrackingError('Invalid or unauthorized geofence ID');
            }
        }

        const now = new Date();
        const updatedTracking = await db.tracking.update({
            where: { id: trackingId },
            data: {
                latitude: validatedData.latitude ?? tracking.latitude,
                longitude: validatedData.longitude ?? tracking.longitude,
                altitude: validatedData.altitude ?? tracking.altitude,
                speed: validatedData.speed ?? tracking.speed,
                bearing: validatedData.bearing ?? tracking.bearing,
                accuracy: validatedData.accuracy ?? tracking.accuracy,
                provider: validatedData.provider ?? tracking.provider,
                comment: validatedData.comment ?? tracking.comment,
                tripId: validatedData.tripId ?? tracking.tripId,
                geofenceEvents: validatedData.geofenceEvent
                    ? {
                          create: {
                              busId: tracking.busId,
                              geofenceId: validatedData.geofenceEvent.geofenceId,
                              event: validatedData.geofenceEvent.event,
                              timestamp: now,
                              createdAt: now,
                              updatedAt: now,
                          },
                      }
                    : undefined,
            },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        model: true,
                        category: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                trip: {
                    select: {
                        id: true,
                        busId: true,
                        routeId: true,
                        destinationIndex: true,
                        departureTime: true,
                        arrivalTime: true,
                        status: true,
                        isFullyBooked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                geofenceEvents: {
                    select: {
                        id: true,
                        busId: true,
                        geofenceId: true,
                        event: true,
                        timestamp: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return {
            id: updatedTracking.id,
            busId: updatedTracking.busId,
            tripId: updatedTracking.tripId ?? undefined,
            time: updatedTracking.time,
            latitude: updatedTracking.latitude,
            longitude: updatedTracking.longitude,
            altitude: updatedTracking.altitude ?? undefined,
            speed: updatedTracking.speed ?? undefined,
            bearing: updatedTracking.bearing ?? undefined,
            accuracy: updatedTracking.accuracy ?? undefined,
            provider: updatedTracking.provider ?? undefined,
            comment: updatedTracking.comment ?? undefined,
            createdAt: updatedTracking.createdAt,
            bus: {
                id: updatedTracking.bus.id,
                licensePlate: updatedTracking.bus.licensePlate,
            },
            trip: updatedTracking.trip
                ? {
                      id: updatedTracking.trip.id,
                      busId: updatedTracking.trip.busId,
                      routeId: updatedTracking.trip.routeId,
                      destinationIndex: updatedTracking.trip.destinationIndex,
                      departureTime: updatedTracking.trip.departureTime,
                      arrivalTime: updatedTracking.trip.arrivalTime ?? undefined,
                      status: updatedTracking.trip.status,
                      isFullyBooked: updatedTracking.trip.isFullyBooked,
                      createdAt: updatedTracking.trip.createdAt,
                      updatedAt: updatedTracking.trip.updatedAt,
                  }
                : undefined,
            geofenceEvents: updatedTracking.geofenceEvents.map((event) => ({
                id: event.id,
                busId: event.busId,
                geofenceId: event.geofenceId,
                event: event.event,
                timestamp: event.timestamp,
                createdAt: event.createdAt,
                updatedAt: event.updatedAt,
                bus: { id: updatedTracking.bus.id, licensePlate: updatedTracking.bus.licensePlate },
                geofence: { id: event.geofenceId, name: '' }, // Name requires additional query if needed
            })),
        };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`updateTracking error: ${errorMsg}`);
        throw new TrackingError(`Failed to update tracking: ${errorMsg}`);
    }
}
