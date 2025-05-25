'use server';

import { db } from '@/lib/prisma';
import { MatatuCapacity, validateCapacity, validCapacities } from '@/utils/constants/matatuSeats';
import { Bus, ReservationStatus } from '@/utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { initializeSeats } from './dbSeats';

// Define MatatuCapacity enum values (adjust based on Prisma schema)
const matatuCapacityValues = ['MINIBUS', 'SHUTTLE', 'BUS', 'VAN'] as const;

// Validation Schemas
const createBusSchema = z.object({
    licensePlate: z.string().min(1, 'License plate is required'),
    capacity: z.union([z.literal(14), z.literal(26), z.literal(33), z.literal(46), z.literal(52), z.literal(67)], {
        errorMap: () => ({ message: `Capacity must be one of ${validCapacities.map(Number).join(', ')}` }),
    }),
    model: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    category: z.enum(matatuCapacityValues, { message: 'Invalid category' }),
    ownerId: z.string().uuid('Owner ID must be a valid UUID'),
    imageSrcs: z.array(z.string()).optional(),
});

const updateBusSchema = z.object({
    licensePlate: z.string().min(1, 'License plate is required').optional(),
    capacity: z
        .union([z.literal(14), z.literal(26), z.literal(33), z.literal(46), z.literal(52), z.literal(67)], {
            errorMap: () => ({ message: `Capacity must be one of ${validCapacities.map(Number).join(', ')}` }),
        })
        .optional(),
    model: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    category: z.enum(matatuCapacityValues, { message: 'Invalid category' }).optional(),
    imageSrcs: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    licensePlate: z.string().optional(),
    capacity: z
        .union([z.literal(14), z.literal(26), z.literal(33), z.literal(46), z.literal(52), z.literal(67)])
        .optional(),
});

const driverTripSchema = z.object({
    driverId: z.string().uuid('Driver ID must be a valid UUID'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

// Custom Error
class BusError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BusError';
    }
}

// Helper function to format a bus entity
function formatBus(bus: any, includeSeats: boolean = false): Bus {
    return {
        id: bus.id,
        ownerId: bus.ownerId,
        licensePlate: bus.licensePlate,
        capacity: bus.capacity,
        model: bus.model ?? undefined,
        latitude: bus.latitude ?? undefined,
        longitude: bus.longitude ?? undefined,
        lastLocationUpdate: bus.lastLocationUpdate?.toISOString() ?? undefined,
        category: bus.category,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
        passengers: bus.seats?.reduce((count: number, seat: any) => count + (seat.reservations?.length || 0), 0) ?? 0,
        images:
            bus.images?.length > 0
                ? bus.images.map((img: any) => ({
                      id: img.id,
                      busId: img.busId,
                      src: img.src,
                      blurDataURL: img.blurDataURL ?? undefined,
                      alt: img.alt,
                  }))
                : [
                      {
                          id: 0,
                          busId: bus.id,
                          src: '/placeholder.jpg',
                          blurDataURL: undefined,
                          alt: 'Vehicle placeholder',
                      },
                  ],
        seats: includeSeats
            ? (bus.seats?.map((seat: any) => ({
                  id: seat.id,
                  seatNumber: seat.seatNumber,
                  price: seat.price,
                  row: seat.row,
                  column: seat.column,
                  category: seat.category ?? undefined,
                  status: seat.status as ReservationStatus,
                  reservations:
                      seat.reservations?.map((r: any) => ({
                          id: r.id,
                          tripId: r.tripId,
                          user: {
                              id: r.user.id,
                              name: r.user.name,
                              email: r.user.email,
                          },
                          status: r.status as ReservationStatus,
                      })) ?? [],
              })) ?? [])
            : undefined,
    };
}

// Create a new bus
export async function createBus(
    data: {
        licensePlate: string;
        capacity: number;
        model?: string;
        latitude?: number;
        longitude?: number;
        category: MatatuCapacity;
        ownerId: string;
        imageSrcs?: string[];
    },
    clerkId: string,
): Promise<Bus> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = createBusSchema.parse(data);

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== 'OWNER' && user.role !== 'ORGANIZATION')) {
                throw new BusError('User is not authorized to create buses');
            }
            if (user.role === 'OWNER' && user.owner?.id !== validatedData.ownerId) {
                throw new BusError('User does not own this owner ID');
            }

            const existingBus = await tx.bus.findUnique({
                where: { licensePlate: validatedData.licensePlate },
            });
            if (existingBus) {
                throw new BusError(`Bus with license plate ${validatedData.licensePlate} already exists`);
            }

            const owner = await tx.owner.findUnique({
                where: { id: validatedData.ownerId },
            });
            if (!owner) {
                throw new BusError(`Owner with ID ${validatedData.ownerId} not found`);
            }

            const bus = await tx.bus.create({
                data: {
                    licensePlate: validatedData.licensePlate,
                    capacity: validatedData.capacity,
                    model: validatedData.model ?? undefined,
                    latitude: validatedData.latitude ?? undefined,
                    longitude: validatedData.longitude ?? undefined,
                    lastLocationUpdate: validatedData.latitude && validatedData.longitude ? new Date() : undefined,
                    category: validatedData.category,
                    ownerId: validatedData.ownerId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    images: validatedData.imageSrcs
                        ? {
                              create: validatedData.imageSrcs.map((src) => ({
                                  src,
                                  alt: `Image of ${validatedData.licensePlate}`,
                              })),
                          }
                        : undefined,
                },
                include: {
                    images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                },
            });

            await initializeSeats(bus.id, validateCapacity(validatedData.capacity));

            console.log(`Bus ${bus.id} created for owner ${validatedData.ownerId} by ${clerkId}`);
            return formatBus(bus);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`createBus error: ${errorMsg}`);
            throw new BusError(`Failed to create bus: ${errorMsg}`);
        }
    });
}

// Get a bus by ID
export async function getBus(busId: string, clerkId: string): Promise<Bus> {
    try {
        if (!busId || typeof busId !== 'string') {
            throw new BusError('Invalid bus ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true, driver: true },
        });
        if (!user || (user.role !== 'OWNER' && user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
            throw new BusError('User is not authorized to fetch bus');
        }

        const bus = await db.bus.findUnique({
            where: { id: busId },
            include: {
                images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                owner: { select: { id: true } },
                driver: { select: { id: true } },
            },
        });

        if (!bus || !bus.owner) {
            throw new BusError(`Bus with ID ${busId} or its owner not found`);
        }

        if (user.role === 'OWNER' && user.owner?.id !== bus.owner.id) {
            throw new BusError('User does not own this bus');
        }
        if (user.role === 'DRIVER' && bus.driver?.id !== user.driver?.id) {
            throw new BusError('Driver is not assigned to this bus');
        }

        return formatBus(bus);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBus error: ${errorMsg}`);
        throw new BusError(`Failed to fetch bus: ${errorMsg}`);
    }
}

// Get buses with pagination and filters
export async function getBuses({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
    clerkId,
}: {
    ownerId?: string;
    page?: number;
    pageSize?: number;
    filters?: { licensePlate?: string; capacity?: number };
    clerkId: string;
}): Promise<{ buses: Bus[]; total: number }> {
    try {
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ORGANIZATION')) {
            throw new BusError('User is not authorized to fetch buses');
        }

        const where: Prisma.BusWhereInput = {
            ...(ownerId && { ownerId }),
            ...(user.role === 'OWNER' && { ownerId: user.owner?.id }),
            ...(validatedFilters.licensePlate && { licensePlate: validatedFilters.licensePlate }),
            ...(validatedFilters.capacity
                ? { capacity: validatedFilters.capacity }
                : { capacity: { in: validCapacities.map(Number) } }),
        };

        const [buses, total] = await Promise.all([
            db.bus.findMany({
                where,
                include: {
                    images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: validatedFilters.licensePlate ? 1 : pagination.pageSize,
                orderBy: { id: 'asc' },
            }),
            db.bus.count({ where }),
        ]);

        const formattedBuses = buses.map((bus) => formatBus(bus));
        return { buses: formattedBuses, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBuses error: ${errorMsg}`);
        throw new BusError(`Failed to fetch buses: ${errorMsg}`);
    }
}

// Update a bus
export async function updateBus(
    busId: string,
    data: Partial<{
        licensePlate: string;
        capacity: number;
        model: string | null;
        latitude: number | null;
        longitude: number | null;
        category: MatatuCapacity;
        imageSrcs: string[];
    }>,
    clerkId: string,
): Promise<Bus> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = updateBusSchema.parse(data);
            if (!busId || typeof busId !== 'string') {
                throw new BusError('Invalid bus ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== 'OWNER' && user.role !== 'ORGANIZATION')) {
                throw new BusError('User is not authorized to update buses');
            }

            const bus = await tx.bus.findUnique({
                where: { id: busId },
                include: {
                    owner: { select: { id: true } },
                    seats: { select: { id: true, reservations: { select: { id: true, status: true } } } },
                    trips: { select: { id: true, status: true } },
                },
            });
            if (!bus || !bus.owner) {
                throw new BusError(`Bus with ID ${busId} or its owner not found`);
            }
            if (user.role === 'OWNER' && user.owner?.id !== bus.owner.id) {
                throw new BusError('User does not own this bus');
            }

            if (validatedData.capacity && validatedData.capacity !== bus.capacity) {
                if (bus.trips.some((t: any) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')) {
                    throw new BusError('Cannot change capacity of bus with active trips');
                }
                if (bus.seats.some((s: any) => s.reservations.length > 0)) {
                    throw new BusError('Cannot change capacity of bus with reserved seats');
                }
            }

            if (validatedData.licensePlate && validatedData.licensePlate !== bus.licensePlate) {
                const existingBus = await tx.bus.findUnique({
                    where: { licensePlate: validatedData.licensePlate },
                });
                if (existingBus && existingBus.id !== busId) {
                    throw new BusError(`Bus with license plate ${validatedData.licensePlate} already exists`);
                }
            }

            const updateData: Prisma.BusUpdateInput = {
                licensePlate: validatedData.licensePlate ?? undefined,
                capacity: validatedData.capacity ?? undefined,
                model: validatedData.model ?? undefined,
                latitude: validatedData.latitude ?? undefined,
                longitude: validatedData.longitude ?? undefined,
                lastLocationUpdate:
                    validatedData.latitude !== undefined || validatedData.longitude !== undefined
                        ? new Date()
                        : undefined,
                category: validatedData.category ?? undefined,
                updatedAt: new Date(),
                ...(validatedData.imageSrcs && {
                    images: {
                        deleteMany: {},
                        create: validatedData.imageSrcs.map((src) => ({
                            src,
                            alt: `Image of ${validatedData.licensePlate || bus.licensePlate}`,
                        })),
                    },
                }),
            };

            const updatedBus = await tx.bus.update({
                where: { id: busId },
                data: updateData,
                include: {
                    images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                },
            });

            if (validatedData.capacity && validatedData.capacity !== bus.capacity) {
                await tx.seat.deleteMany({ where: { busId } });
                await initializeSeats(busId, validateCapacity(validatedData.capacity));
            }

            console.log(`Bus ${busId} updated by ${clerkId}`);
            return formatBus(updatedBus);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`updateBus error: ${errorMsg}`);
            throw new BusError(`Failed to update bus: ${errorMsg}`);
        }
    });
}

// Delete a bus
export async function deleteBus(busId: string, clerkId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            if (!busId || typeof busId !== 'string') {
                throw new BusError('Invalid bus ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== 'OWNER' && user.role !== 'ORGANIZATION')) {
                throw new BusError('User is not authorized to delete buses');
            }

            const bus = await tx.bus.findUnique({
                where: { id: busId },
                include: {
                    owner: { select: { id: true } },
                    seats: { select: { id: true, reservations: { select: { id: true, status: true } } } },
                    trips: { select: { id: true, status: true } },
                    driver: { select: { id: true } },
                },
            });
            if (!bus || !bus.owner) {
                throw new BusError(`Bus with ID ${busId} or its owner not found`);
            }
            if (user.role === 'OWNER' && user.owner?.id !== bus.owner.id) {
                throw new BusError('User does not own this bus');
            }

            if (bus.trips.some((t: any) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')) {
                throw new BusError('Cannot delete bus with active trips');
            }
            if (bus.seats.some((s: any) => s.reservations.some((r: any) => r.status === 'CONFIRMED'))) {
                throw new BusError('Cannot delete bus with reserved seats');
            }
            if (bus.driver) {
                throw new BusError('Cannot delete bus with assigned driver');
            }

            await tx.bus.delete({
                where: { id: busId },
            });

            console.log(`Bus ${busId} deleted by ${clerkId}`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`deleteBus error: ${errorMsg}`);
            throw new BusError(`Failed to delete bus: ${errorMsg}`);
        }
    });
}

// Get bus by driver ID
export async function getBusByDriverId(driverId: string, clerkId: string): Promise<Bus> {
    try {
        if (!driverId || typeof driverId !== 'string') {
            throw new BusError('Invalid driver ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
            throw new BusError('User is not authorized to fetch bus');
        }
        if (user.role === 'DRIVER' && user.driver?.id !== driverId) {
            throw new BusError('User is not authorized for this driver');
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
                bus: {
                    include: {
                        images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                    },
                },
            },
        });

        if (!driver?.bus) {
            throw new BusError('Bus not found for driver');
        }

        return formatBus(driver.bus);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBusByDriverId error: ${errorMsg}`);
        throw new BusError(`Failed to fetch bus: ${errorMsg}`);
    }
}

// Get bus details for driver’s active trip
export async function getBusDetailsForDriverTrip({
    driverId,
    clerkId,
}: {
    driverId: string;
    clerkId: string;
}): Promise<Bus> {
    try {
        const validatedData = driverTripSchema.parse({ driverId, clerkId });

        const user = await db.user.findUnique({
            where: { clerkId: validatedData.clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
            throw new BusError('User is not authorized to fetch bus details');
        }
        if (user.role === 'DRIVER' && user.driver?.id !== validatedData.driverId) {
            throw new BusError('User is not authorized for this driver');
        }

        const trip = await db.trip.findFirst({
            where: { driverId: validatedData.driverId, status: 'IN_PROGRESS' },
            include: {
                bus: {
                    include: {
                        images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
                        seats: {
                            select: {
                                id: true,
                                seatNumber: true,
                                price: true,
                                row: true,
                                column: true,
                                category: true,
                                status: true,
                                reservations: {
                                    select: {
                                        id: true,
                                        tripId: true,
                                        user: { select: { id: true, name: true, email: true } },
                                        status: true,
                                    },
                                    where: { status: 'CONFIRMED' },
                                },
                            },
                        },
                        owner: { select: { id: true } },
                    },
                },
            },
        });

        if (!trip || !trip.bus) {
            throw new BusError('No active trip or bus found for driver');
        }

        const formattedBus = formatBus(
            {
                ...trip.bus,
                ownerId: trip.bus.ownerId,
                seats: trip.bus.seats.map((seat: any) => ({
                    ...seat,
                    reservations: seat.reservations.filter((r: any) => r.tripId === trip.id),
                })),
            },
            true,
        );

        return formattedBus;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBusDetailsForDriverTrip error: ${errorMsg}`);
        throw new BusError(`Failed to fetch bus details for driver trip: ${errorMsg}`);
    }
}
