'use server';

import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Driver, DriverData, Reservation, Trip, Fuel } from '@/utils';
import { z } from 'zod';

// Types
interface Bus {
    id: string;
    licensePlate: string;
    capacity: number;
    category: string;
    createdAt: Date;
    updatedAt: Date;
    model?: string;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: Date;
    ownerId?: string;
    organizationId?: string;
    images: { id: string; busId: string; src: string; blurDataURL?: string; alt: string }[];
    seats?: {
        id: string;
        seatNumber: number;
        price: number;
        row: number;
        column: number;
        category?: string;
        status: string;
        reservations?: any[];
    }[];
}

// Validation Schemas
const schemas = {
    createDriver: z.object({
        userId: z.string().uuid('User ID must be a valid UUID'),
        licenseNumber: z.string().min(1, 'License number is required'),
        status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Invalid status' }),
        busId: z.string().uuid('Bus ID must be a valid UUID').optional().nullable(),
        profileImageUrl: z.string().min(1, 'Profile image URL is required'),
        clerkId: z.string().min(1, 'Clerk ID is required'),
    }),
    updateDriver: z.object({
        licenseNumber: z.string().min(1, 'License number is required').optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        busId: z.string().uuid('Bus ID must be a valid UUID').optional().nullable(),
        profileImageUrl: z.string().min(1, 'Profile image URL is required').optional(),
        rating: z.number().min(0, 'Rating must be between 0 and 5').max(5).optional().nullable(),
    }),
    pagination: z.object({
        page: z.number().int().min(1, 'Page must be at least 1').default(1),
        pageSize: z.number().int().min(1, 'Page size must be between 1 and 100').max(100).default(10),
    }),
    filter: z.object({
        licenseNumber: z.string().optional(),
    }),
    driverFuel: z.object({
        driverId: z.string().uuid('Driver ID must be a valid UUID'),
        clerkId: z.string().min(1, 'Clerk ID is required'),
        page: z.number().int().min(1, 'Page must be at least 1').default(1),
        pageSize: z.number().int().min(1, 'Page size must be between 1 and 100').max(100).default(10),
    }),
    driverId: z.string().min(1, 'Invalid driver ID'),
};

// Custom Error
class DriverError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DriverError';
    }
}

// Common Prisma Include Configurations
const driverInclude: Prisma.DriverInclude = {
    user: { select: { name: true, email: true, image: true } },
    bus: {
        select: {
            id: true,
            licensePlate: true,
            capacity: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            model: true,
            latitude: true,
            longitude: true,
            lastLocationUpdate: true,
            ownerId: true,
            organizationId: true,
            images: true,
            seats: {
                select: {
                    id: true,
                    seatNumber: true,
                    price: true,
                    row: true,
                    column: true,
                    category: true,
                    status: true,
                    reservations: true,
                },
            },
        },
    },
};

const tripInclude: Prisma.TripInclude = {
    bus: {
        include: {
            images: { select: { id: true, busId: true, src: true, blurDataURL: true, alt: true } },
            seats: {
                select: {
                    id: true,
                    seatNumber: true,
                    category: true,
                    status: true,
                    price: true,
                    row: true,
                    column: true,
                },
            },
        },
    },
    route: {
        select: {
            id: true,
            route_number: true,
            pickup_point: true,
            destinations: true,
            helix: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    reservations: {
        where: { status: 'CONFIRMED' },
        include: {
            seat: {
                select: {
                    id: true,
                    seatNumber: true,
                    category: true,
                    busId: true,
                    price: true,
                    row: true,
                    column: true,
                    status: true,
                    bus: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    clerkId: true,
                    image: true,
                    role: true,
                    phoneNumber: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    },
};

// Utility Functions
function handleError(error: unknown, context: string): never {
    const errorMsg =
        error instanceof z.ZodError
            ? error.errors.map((e) => e.message).join(', ')
            : error instanceof Error
              ? error.message
              : String(error);
    console.error(`${context} error: ${errorMsg}`);
    throw new DriverError(`Failed to ${context}: ${errorMsg}`);
}

async function checkAuthorization(
    clerkId: string,
    roleRequired: string | string[],
    driverId?: string,
    ownerId?: string,
): Promise<{ user: any; driver?: any; owner?: any }> {
    const user = await db.user.findUnique({
        where: { clerkId },
        include: { driver: { select: { id: true } }, owner: { select: { id: true } } },
    });
    if (!user) throw new DriverError('User not found');

    const roles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!roles.includes(user.role)) throw new DriverError('User is not authorized');

    if (user.role === 'DRIVER' && driverId && user.driver?.id !== driverId) {
        throw new DriverError('User is not authorized for this driver');
    }
    if (user.role === 'OWNER' && ownerId && user.owner?.id !== ownerId) {
        throw new DriverError('User does not own this resource');
    }

    return { user, driver: user.driver, owner: user.owner };
}

function formatBus(bus: any): Bus | undefined {
    if (!bus) return undefined;
    return {
        id: bus.id,
        licensePlate: bus.licensePlate,
        capacity: bus.capacity,
        category: bus.category,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
        model: bus.model ?? undefined,
        latitude: bus.latitude ?? undefined,
        longitude: bus.longitude ?? undefined,
        lastLocationUpdate: bus.lastLocationUpdate ?? undefined,
        ownerId: bus.ownerId ?? undefined,
        organizationId: bus.organizationId ?? undefined,
        images:
            bus.images?.map((img: any) => ({
                id: img.id,
                busId: img.busId,
                src: img.src,
                blurDataURL: img.blurDataURL ?? undefined,
                alt: img.alt,
            })) ?? [],
        seats:
            bus.seats?.map((seat: any) => ({
                id: seat.id,
                seatNumber: seat.seatNumber,
                price: seat.price,
                row: seat.row,
                column: seat.column,
                category: seat.category ?? undefined,
                status: seat.status,
                reservations: seat.reservations ?? [],
            })) ?? [],
    };
}

function formatDriver(driver: any, user: any, bus?: any): Driver {
    return {
        id: driver.id,
        busId: driver.busId ?? undefined,
        userId: driver.userId,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        rating: driver.rating ?? undefined,
        profileImageUrl: driver.profileImageUrl,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
        user: {
            name: user.name,
            email: user.email,
            image: user.image,
        },
        bus: formatBus(bus),
    };
}

function formatReservation(reservation: any): Reservation {
    return {
        id: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        status: reservation.status,
        bookedAt: reservation.bookedAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
        paymentId: reservation.paymentId ?? undefined,
        user: {
            id: reservation.user.id,
            name: reservation.user.name,
            email: reservation.user.email,
            clerkId: reservation.user.clerkId,
            image: reservation.user.image,
            role: reservation.user.role,
            phoneNumber: reservation.user.phoneNumber ?? undefined,
            createdAt: reservation.user.createdAt,
            updatedAt: reservation.user.updatedAt,
        },
        seat: {
            id: reservation.seat.id,
            seatNumber: reservation.seat.seatNumber,
            category: reservation.seat.category ?? undefined,
            busId: reservation.seat.busId,
            price: reservation.seat.price,
            row: reservation.seat.row,
            column: reservation.seat.column,
            status: reservation.seat.status,
            reservations: reservation.seat.reservations ?? [],
            bus: formatBus(reservation.seat.bus),
        },
    };
}

function formatFuel(record: any): Fuel {
    return {
        id: record.id,
        busId: record.busId,
        fuelQuantity: record.fuelQuantity,
        odometerReading: record.odometerReading,
        fuelPrice: record.fuelPrice,
        fuelFillDate: record.fuelFillDate.toISOString(),
        fuelAddedBy: record.fuelAddedBy,
        fuelComments: record.fuelComments ?? undefined,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        bus: { id: record.bus.id, licensePlate: record.bus.licensePlate },
    };
}

function formatTrip(tripRecord: any): Trip {
    const pickupPoint = tripRecord.route?.pickup_point as {
        pickup_point: string;
        pickup_latlng?: { latitude: number; longitude: number };
    };
    const destination =
        (tripRecord.route?.destinations?.[tripRecord.destinationIndex] as {
            destination: string;
            destination_latlng?: { latitude: number; longitude: number };
        }) || {};
    return {
        id: tripRecord.id,
        busId: tripRecord.busId,
        driverId: tripRecord.driverId ?? undefined,
        routeId: tripRecord.routeId,
        destinationIndex: tripRecord.destinationIndex,
        departureCity: pickupPoint?.pickup_point ?? '',
        arrivalCity: destination?.destination ?? '',
        departureTime: tripRecord.departureTime,
        arrivalTime: tripRecord.arrivalTime ?? undefined,
        status: tripRecord.status,
        isFullyBooked: tripRecord.isFullyBooked,
        originLatitude: pickupPoint?.pickup_latlng?.latitude ?? undefined,
        originLongitude: pickupPoint?.pickup_latlng?.longitude ?? undefined,
        destinationLatitude: destination?.destination_latlng?.latitude ?? undefined,
        destinationLongitude: destination?.destination_latlng?.longitude ?? undefined,
        createdAt: tripRecord.createdAt,
        updatedAt: tripRecord.updatedAt,
        bus: {
            id: tripRecord.bus.id,
            licensePlate: tripRecord.bus.licensePlate,
            capacity: tripRecord.bus.capacity,
            category: tripRecord.bus.category,
            images: tripRecord.bus.images.map((img: any) => ({
                id: img.id,
                busId: img.busId,
                src: img.src,
                blurDataURL: img.blurDataURL ?? undefined,
                alt: img.alt,
            })),
            passengers:
                tripRecord.bus.seats?.reduce(
                    (count: number, seat: any) => count + (seat.reservations?.length || 0),
                    0,
                ) ?? 0,
            seats: tripRecord.bus.seats.map((seat: any) => ({
                id: seat.id,
                seatNumber: seat.seatNumber,
                category: seat.category ?? undefined,
                status: seat.status,
                price: seat.price,
                row: seat.row,
                column: seat.column,
                busId: seat.busId,
                reservations: seat.reservations ?? [],
            })),
        },
    };
}

// Create Driver
export async function createDriver({
    userId,
    licenseNumber,
    status,
    busId,
    profileImageUrl,
    clerkId,
}: {
    userId: string;
    licenseNumber: string;
    status: 'ACTIVE' | 'INACTIVE';
    busId?: string | null;
    profileImageUrl: string;
    clerkId: string;
}): Promise<Driver> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = schemas.createDriver.parse({
                userId,
                licenseNumber,
                status,
                busId,
                profileImageUrl,
                clerkId,
            });
            await checkAuthorization(validatedData.clerkId, 'ORGANIZATION');

            const user = await tx.user.findUnique({
                where: { id: validatedData.userId },
                select: { id: true, name: true, email: true, image: true, role: true },
            });
            if (!user || user.role !== 'DRIVER') throw new DriverError('User does not exist or is not a DRIVER');

            const existingDriver = await tx.driver.findUnique({
                where: { licenseNumber: validatedData.licenseNumber },
            });
            if (existingDriver) throw new DriverError('License number already in use');

            if (validatedData.busId) {
                const bus = await tx.bus.findUnique({
                    where: { id: validatedData.busId },
                    include: { driver: { select: { id: true } } },
                });
                if (!bus) throw new DriverError(`Bus with ID ${validatedData.busId} not found`);
                if (bus.driver)
                    throw new DriverError(`Bus with ID ${validatedData.busId} already has a driver assigned`);
            }

            const driver = await tx.driver.create({
                data: {
                    userId: validatedData.userId,
                    licenseNumber: validatedData.licenseNumber,
                    status: validatedData.status,
                    busId: validatedData.busId ?? null,
                    profileImageUrl: validatedData.profileImageUrl,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                include: driverInclude,
            });

            console.log(`Driver ${driver.id} created by ${clerkId}`);
            return formatDriver(driver, driver.user, driver.bus);
        } catch (error) {
            handleError(error, 'createDriver');
        }
    });
}

// Get Driver by ID
export async function getDriver({ driverId, clerkId }: { driverId: string; clerkId: string }): Promise<Driver> {
    try {
        schemas.driverId.parse(driverId);
        const {
            user,
            driver: authDriver,
            owner,
        } = await checkAuthorization(clerkId, ['DRIVER', 'ORGANIZATION', 'OWNER']);

        const driver = await db.driver.findUnique({ where: { id: driverId }, include: driverInclude });
        if (!driver) throw new DriverError('Driver not found');

        if (user.role === 'DRIVER' && authDriver?.id !== driverId)
            throw new DriverError('User is not authorized for this driver');
        if (user.role === 'OWNER' && owner?.id !== driver.bus?.ownerId)
            throw new DriverError('User does not own the bus assigned to this driver');

        return formatDriver(driver, driver.user, driver.bus);
    } catch (error) {
        handleError(error, 'getDriver');
    }
}

// Get Drivers
export async function getDrivers({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
    clerkId,
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { licenseNumber?: string };
    clerkId: string;
}): Promise<{ drivers: Driver[]; total: number }> {
    try {
        const pagination = schemas.pagination.parse({ page, pageSize });
        const validatedFilters = schemas.filter.parse(filters);
        if (!ownerId) throw new DriverError('Invalid owner ID');

        await checkAuthorization(clerkId, ['OWNER', 'ORGANIZATION'], undefined, ownerId);

        const where: Prisma.DriverWhereInput = {
            bus: { ownerId },
            ...(validatedFilters.licenseNumber && { licenseNumber: validatedFilters.licenseNumber }),
        };

        const [drivers, total] = await Promise.all([
            db.driver.findMany({
                where,
                include: driverInclude,
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { id: 'asc' },
            }),
            db.driver.count({ where }),
        ]);

        return { drivers: drivers.map((driver) => formatDriver(driver, driver.user, driver.bus)), total };
    } catch (error) {
        handleError(error, 'getDrivers');
    }
}

// Update Driver
export async function updateDriver(
    driverId: string,
    data: Partial<{
        licenseNumber: string;
        status: 'ACTIVE' | 'INACTIVE';
        busId: string | null;
        profileImageUrl: string;
        rating: number | null;
    }>,
    clerkId: string,
): Promise<Driver> {
    return await db.$transaction(async (tx) => {
        try {
            schemas.driverId.parse(driverId);
            const validatedData = schemas.updateDriver.parse(data);
            await checkAuthorization(clerkId, 'ORGANIZATION');

            const driver = await tx.driver.findUnique({
                where: { id: driverId },
                include: { trips: { select: { id: true, status: true } }, bus: { select: { id: true } } },
            });
            if (!driver) throw new DriverError('Driver not found');

            if (validatedData.busId && validatedData.busId !== driver.busId) {
                const bus = await tx.bus.findUnique({
                    where: { id: validatedData.busId },
                    include: { driver: { select: { id: true } } },
                });
                if (!bus) throw new DriverError(`Bus with ID ${validatedData.busId} not found`);
                if (bus.driver && bus.driver.id !== driverId)
                    throw new DriverError(`Bus with ID ${validatedData.busId} already has a driver assigned`);
                if (driver.trips.some((t: any) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')) {
                    throw new DriverError('Cannot change bus assignment for driver with active or scheduled trips');
                }
            }

            if (validatedData.licenseNumber && validatedData.licenseNumber !== driver.licenseNumber) {
                const existingDriver = await tx.driver.findUnique({
                    where: { licenseNumber: validatedData.licenseNumber },
                });
                if (existingDriver && existingDriver.id !== driverId)
                    throw new DriverError('License number already in use');
            }

            const updatedDriver = await tx.driver.update({
                where: { id: driverId },
                data: {
                    licenseNumber: validatedData.licenseNumber ?? undefined,
                    status: validatedData.status ?? undefined,
                    busId: validatedData.busId ?? undefined,
                    profileImageUrl: validatedData.profileImageUrl ?? undefined,
                    rating: validatedData.rating ?? undefined,
                    updatedAt: new Date(),
                },
                include: driverInclude,
            });

            console.log(`Driver ${driverId} updated by ${clerkId}`);
            return formatDriver(updatedDriver, updatedDriver.user, updatedDriver.bus);
        } catch (error) {
            handleError(error, 'updateDriver');
        }
    });
}

// Delete Driver
export async function deleteDriver(driverId: string, clerkId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            schemas.driverId.parse(driverId);
            await checkAuthorization(clerkId, 'ORGANIZATION');

            const driver = await tx.driver.findUnique({
                where: { id: driverId },
                include: { trips: { select: { id: true, status: true } }, bus: { select: { id: true } } },
            });
            if (!driver) throw new DriverError('Driver not found');

            if (driver.trips.some((trip: any) => trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS')) {
                throw new DriverError('Cannot delete driver with active or scheduled trips');
            }

            const fuelRecords = await tx.fuel.findMany({ where: { busId: driver.bus?.id }, take: 1 });
            if (fuelRecords.length) throw new DriverError('Cannot delete driver assigned to a bus with fuel records');

            await tx.driver.delete({ where: { id: driverId } });
            console.log(`Driver ${driverId} deleted by ${clerkId}`);
        } catch (error) {
            handleError(error, 'deleteDriver');
        }
    });
}

// Get Driver by ID (Simplified)
export async function getDriverById({ driverId, clerkId }: { driverId: string; clerkId: string }): Promise<Driver> {
    try {
        schemas.driverId.parse(driverId);
        const {
            user,
            driver: authDriver,
            owner,
        } = await checkAuthorization(clerkId, ['DRIVER', 'ORGANIZATION', 'OWNER']);

        const driver = await db.driver.findUnique({ where: { id: driverId }, include: driverInclude });
        if (!driver) throw new DriverError('Driver not found');

        if (user.role === 'DRIVER' && authDriver?.id !== driverId)
            throw new DriverError('User is not authorized for this driver');
        if (user.role === 'OWNER' && owner?.id !== driver.bus?.ownerId)
            throw new DriverError('User does not own the bus assigned to this driver');

        return formatDriver(driver, driver.user, driver.bus);
    } catch (error) {
        handleError(error, 'getDriverById');
    }
}

// Get Driver Data with Trip, Reservations, and Fuel Records
export async function getDriverData(clerkId: string): Promise<DriverData> {
    try {
        schemas.clerkId.parse(clerkId);
        const { user, driver: driverRecord } = await checkAuthorization(clerkId, 'DRIVER');
        if (!driverRecord) throw new DriverError('User has no driver profile');

        const driverData = await db.driver.findUnique({
            where: { id: driverRecord.id },
            include: {
                ...driverInclude,
                trips: {
                    where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                    include: tripInclude,
                    orderBy: { departureTime: 'desc' },
                    take: 1,
                },
            },
        });

        if (!driverData) throw new DriverError('Driver not found');

        let trip: Trip | null = null;
        let reservations: Reservation[] = [];
        let fuelRecords: Fuel[] = [];

        if (driverData.bus?.id) {
            const fuels = await db.fuel.findMany({
                where: { busId: driverData.bus.id },
                include: { bus: { select: { id: true, licensePlate: true } } },
                orderBy: { fuelFillDate: 'desc' },
                take: 5,
            });
            fuelRecords = fuels.map(formatFuel);
        }

        if (driverData.trips[0]) {
            trip = formatTrip(driverData.trips[0]);
            reservations = driverData.trips[0].reservations.map(formatReservation);
        }

        return {
            driver: formatDriver(driverData, driverData.user, driverData.bus),
            trip,
            reservations,
            fuelRecords,
        };
    } catch (error) {
        handleError(error, 'getDriverData');
    }
}

// Get Driver Reservations for Active Trip
export async function getDriverReservations({
    driverId,
    clerkId,
}: {
    driverId: string;
    clerkId: string;
}): Promise<Reservation[]> {
    try {
        schemas.driverId.parse(driverId);
        await checkAuthorization(clerkId, ['DRIVER', 'ORGANIZATION'], driverId);

        const trip = await db.trip.findFirst({
            where: { driverId, status: 'IN_PROGRESS' },
            include: {
                reservations: {
                    where: { status: 'CONFIRMED' },
                    include: {
                        seat: {
                            select: {
                                id: true,
                                seatNumber: true,
                                category: true,
                                busId: true,
                                price: true,
                                row: true,
                                column: true,
                                status: true,
                                bus: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                clerkId: true,
                                image: true,
                                role: true,
                                phoneNumber: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
            },
        });

        return trip ? trip.reservations.map(formatReservation) : [];
    } catch (error) {
        handleError(error, 'getDriverReservations');
    }
}

// Get Driver Fuel Records for Assigned Bus
export async function getDriverFuelRecords({
    driverId,
    clerkId,
    page = 1,
    pageSize = 10,
}: {
    driverId: string;
    clerkId: string;
    page?: number;
    pageSize?: number;
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const validatedData = schemas.driverFuel.parse({ driverId, clerkId, page, pageSize });
        await checkAuthorization(clerkId, ['DRIVER', 'ORGANIZATION'], driverId);

        const driver = await db.driver.findUnique({
            where: { id: validatedData.driverId },
            include: { bus: { select: { id: true } } },
        });
        if (!driver?.bus) return { fuelRecords: [], total: 0 };

        const [fuelRecords, total] = await Promise.all([
            db.fuel.findMany({
                where: { busId: driver.bus.id },
                include: { bus: { select: { id: true, licensePlate: true } } },
                skip: (validatedData.page - 1) * validatedData.pageSize,
                take: validatedData.pageSize,
                orderBy: { fuelFillDate: 'desc' },
            }),
            db.fuel.count({ where: { busId: driver.bus.id } }),
        ]);

        return { fuelRecords: fuelRecords.map(formatFuel), total };
    } catch (error) {
        handleError(error, 'getDriverFuelRecords');
    }
}
