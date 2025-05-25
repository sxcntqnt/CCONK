'use server';

import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Driver, DriverData, Reservation, Trip, Fuel } from '@/utils';
import { z } from 'zod';

// Validation Schemas
const createDriverSchema = z.object({
    userId: z.string().uuid('User ID must be a valid UUID'),
    licenseNumber: z.string().min(1, 'License number is required'),
    status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Invalid status' }),
    busId: z.string().uuid('Bus ID must be a valid UUID').optional().nullable(),
    profileImageUrl: z.string().min(1, 'Profile image URL is required'),
});

const updateDriverSchema = z.object({
    licenseNumber: z.string().min(1, 'License number is required').optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    busId: z.string().uuid('Bus ID must be a valid UUID').optional().nullable(),
    profileImageUrl: z.string().min(1, 'Profile image URL is required').optional(),
    rating: z.number().min(0).max(5, 'Rating must be between 0 and 5').optional().nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    licenseNumber: z.string().optional(),
});

const driverFuelSchema = z.object({
    driverId: z.string().uuid('Driver ID must be a valid UUID'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

// Custom Error
class DriverError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DriverError';
    }
}

// Helper function to format Driver data
function formatReservation(reservation: ReservationWithRelations): Reservation {
    return {
        id: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        status: reservation.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
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
            bus: reservation.seat.bus
                ? {
                      id: reservation.seat.bus.id,
                      licensePlate: reservation.seat.bus.licensePlate,
                      capacity: reservation.seat.bus.capacity,
                      category: reservation.seat.bus.category,
                      createdAt: reservation.seat.bus.createdAt,
                      updatedAt: reservation.seat.bus.updatedAt,
                      model: reservation.seat.bus.model ?? undefined,
                      latitude: reservation.seat.bus.latitude ?? undefined,
                      longitude: reservation.seat.bus.longitude ?? undefined,
                      lastLocationUpdate: reservation.seat.bus.lastLocationUpdate?.toISOString() ?? undefined,
                      ownerId: reservation.seat.bus.ownerId ?? undefined,
                      organizationId: reservation.seat.bus.organizationId ?? undefined,
                      images:
                          reservation.seat.bus.images?.map((img: any) => ({
                              id: img.id,
                              busId: img.busId,
                              src: img.src,
                              blurDataURL: img.blurDataURL ?? undefined,
                              alt: img.alt,
                          })) ?? [],
                      seats: [],
                  }
                : undefined,
        },
    };
}
// Helper function to format Reservation data
function formatReservation(reservation: any): Reservation {
    return {
        id: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        status: reservation.status as 'PENDING' | 'CONFIRMED' | 'CANCELLED',
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
        },
    };
}

// Helper function to format Fuel data
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
        bus: {
            id: record.bus.id,
            licensePlate: record.bus.licensePlate,
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
            const validatedData = createDriverSchema.parse({ userId, licenseNumber, status, busId, profileImageUrl });

            const authUser = await tx.user.findUnique({
                where: { clerkId },
                select: { role: true },
            });
            if (!authUser || authUser.role !== 'ORGANIZATION') {
                throw new DriverError('User is not authorized to create drivers');
            }

            const user = await tx.user.findUnique({
                where: { id: validatedData.userId },
                select: { id: true, name: true, email: true, image: true, role: true },
            });
            if (!user || user.role !== 'DRIVER') {
                throw new DriverError('User does not exist or is not a DRIVER');
            }

            const existingDriver = await tx.driver.findUnique({
                where: { licenseNumber: validatedData.licenseNumber },
            });
            if (existingDriver) {
                throw new DriverError('License number already in use');
            }

            if (validatedData.busId) {
                const bus = await tx.bus.findUnique({
                    where: { id: validatedData.busId },
                    include: { driver: { select: { id: true } } },
                });
                if (!bus) {
                    throw new DriverError(`Bus with ID ${validatedData.busId} not found`);
                }
                if (bus.driver) {
                    throw new DriverError(`Bus with ID ${validatedData.busId} already has a driver assigned`);
                }
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
                include: {
                    user: { select: { name: true, email: true, image: true } },
                    bus: validatedData.busId
                        ? {
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
                          }
                        : false,
                },
            });

            console.log(`Driver ${driver.id} created by ${clerkId}`);
            return formatDriver(driver, driver.user, driver.bus);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`createDriver error: ${errorMsg}`);
            throw new DriverError(`Failed to create driver: ${errorMsg}`);
        }
    });
}

// Get Driver by ID
export async function getDriver({ driverId, clerkId }: { driverId: string; clerkId: string }): Promise<Driver> {
    try {
        if (!driverId || typeof driverId !== 'string') {
            throw new DriverError('Invalid driver ID');
        }

        const authUser = await db.user.findUnique({
            where: { clerkId },
            select: { role: true, driver: { select: { id: true } }, owner: { select: { id: true } } },
        });
        if (
            !authUser ||
            (authUser.role !== 'DRIVER' && authUser.role !== 'ORGANIZATION' && authUser.role !== 'OWNER')
        ) {
            throw new DriverError('User is not authorized to fetch driver');
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
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
            },
        });

        if (!driver) {
            throw new DriverError('Driver not found');
        }

        if (authUser.role === 'DRIVER' && authUser.driver?.id !== driverId) {
            throw new DriverError('User is not authorized for this driver');
        }
        if (authUser.role === 'OWNER' && authUser.owner?.id !== driver.bus?.ownerId) {
            throw new DriverError('User does not own the bus assigned to this driver');
        }

        return formatDriver(driver, driver.user, driver.bus);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriver error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch driver: ${errorMsg}`);
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
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);
        if (!ownerId || typeof ownerId !== 'string') {
            throw new DriverError('Invalid owner ID');
        }

        const authUser = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!authUser || (authUser.role !== 'OWNER' && authUser.role !== 'ORGANIZATION')) {
            throw new DriverError('User is not authorized to fetch drivers');
        }
        if (authUser.role === 'OWNER' && authUser.owner?.id !== ownerId) {
            throw new DriverError('User is not authorized for this owner');
        }

        const where: Prisma.DriverWhereInput = {
            bus: { ownerId },
            ...(validatedFilters.licenseNumber && { licenseNumber: validatedFilters.licenseNumber }),
        };

        const [drivers, total] = await Promise.all([
            db.driver.findMany({
                where,
                select: {
                    id: true,
                    busId: true,
                    userId: true,
                    licenseNumber: true,
                    status: true,
                    rating: true,
                    profileImageUrl: true,
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
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { id: 'asc' },
            }),
            db.driver.count({ where }),
        ]);

        const formattedDrivers = drivers.map((driver) => formatDriver(driver, driver.user, driver.bus));
        return { drivers: formattedDrivers, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDrivers error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch drivers: ${errorMsg}`);
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
            const validatedData = updateDriverSchema.parse(data);
            if (!driverId || typeof driverId !== 'string') {
                throw new DriverError('Invalid driver ID');
            }

            const authUser = await tx.user.findUnique({
                where: { clerkId },
                select: { role: true },
            });
            if (!authUser || authUser.role !== 'ORGANIZATION') {
                throw new DriverError('User is not authorized to update drivers');
            }

            const driver = await tx.driver.findUnique({
                where: { id: driverId },
                include: {
                    trips: { select: { id: true, status: true } },
                    bus: { select: { id: true } },
                },
            });
            if (!driver) {
                throw new DriverError('Driver not found');
            }

            if (validatedData.busId && validatedData.busId !== driver.busId) {
                const bus = await tx.bus.findUnique({
                    where: { id: validatedData.busId },
                    include: { driver: { select: { id: true } } },
                });
                if (!bus) {
                    throw new DriverError(`Bus with ID ${validatedData.busId} not found`);
                }
                if (bus.driver && bus.driver.id !== driverId) {
                    throw new DriverError(`Bus with ID ${validatedData.busId} already has a driver assigned`);
                }
                if (driver.trips.some((t: any) => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')) {
                    throw new DriverError('Cannot change bus assignment for driver with active or scheduled trips');
                }
            }

            if (validatedData.licenseNumber && validatedData.licenseNumber !== driver.licenseNumber) {
                const existingDriver = await tx.driver.findUnique({
                    where: { licenseNumber: validatedData.licenseNumber },
                });
                if (existingDriver && existingDriver.id !== driverId) {
                    throw new DriverError('License number already in use');
                }
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
                include: {
                    user: { select: { name: true, email: true, image: true } },
                    bus: validatedData.busId
                        ? {
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
                          }
                        : false,
                },
            });

            console.log(`Driver ${driverId} updated by ${clerkId}`);
            return formatDriver(updatedDriver, updatedDriver.user, updatedDriver.bus);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`updateDriver error: ${errorMsg}`);
            throw new DriverError(`Failed to update driver: ${errorMsg}`);
        }
    });
}

// Delete Driver
export async function deleteDriver(driverId: string, clerkId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            if (!driverId || typeof driverId !== 'string') {
                throw new DriverError('Invalid driver ID');
            }

            const authUser = await tx.user.findUnique({
                where: { clerkId },
                select: { role: true },
            });
            if (!authUser || authUser.role !== 'ORGANIZATION') {
                throw new DriverError('User is not authorized to delete drivers');
            }

            const driver = await tx.driver.findUnique({
                where: { id: driverId },
                include: {
                    trips: { select: { id: true, status: true } },
                    bus: { select: { id: true } },
                },
            });
            if (!driver) {
                throw new DriverError('Driver not found');
            }

            if (driver.trips.some((trip: any) => trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS')) {
                throw new DriverError('Cannot delete driver with active or scheduled trips');
            }

            const fuelRecords = await tx.fuel.findMany({
                where: { busId: driver.bus?.id },
                take: 1,
            });
            if (fuelRecords.length) {
                throw new DriverError('Cannot delete driver assigned to a bus with fuel records');
            }

            await tx.driver.delete({
                where: { id: driverId },
            });

            console.log(`Driver ${driverId} deleted by ${clerkId}`);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`deleteDriver error: ${errorMsg}`);
            throw new DriverError(`Failed to delete driver: ${errorMsg}`);
        }
    });
}

// Get Driver by ID (Simplified)
export async function getDriverById({ driverId, clerkId }: { driverId: string; clerkId: string }): Promise<Driver> {
    try {
        if (!driverId || typeof driverId !== 'string') {
            throw new DriverError('Invalid driver ID');
        }

        const authUser = await db.user.findUnique({
            where: { clerkId },
            select: { role: true, driver: { select: { id: true } }, owner: { select: { id: true } } },
        });
        if (
            !authUser ||
            (authUser.role !== 'DRIVER' && authUser.role !== 'ORGANIZATION' && authUser.role !== 'OWNER')
        ) {
            throw new DriverError('User is not authorized to fetch driver');
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
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
            },
        });

        if (!driver) {
            throw new DriverError('Driver not found');
        }

        if (authUser.role === 'DRIVER' && authUser.driver?.id !== driverId) {
            throw new DriverError('User is not authorized for this driver');
        }
        if (authUser.role === 'OWNER' && authUser.owner?.id !== driver.bus?.ownerId) {
            throw new DriverError('User does not own the bus assigned to this driver');
        }

        return formatDriver(driver, driver.user, driver.bus);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriverById error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch driver: ${errorMsg}`);
    }
}

// Get Driver Data with Trip, Reservations, and Fuel Records
export async function getDriverData(clerkId: string): Promise<DriverData> {
    try {
        if (!clerkId || typeof clerkId !== 'string') {
            throw new DriverError('Invalid clerk ID');
        }

        const driverRecord = await db.user.findUnique({
            where: { clerkId },
            include: {
                driver: {
                    include: {
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
                        trips: {
                            where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                            include: {
                                bus: {
                                    include: {
                                        images: {
                                            select: { id: true, busId: true, src: true, blurDataURL: true, alt: true },
                                        },
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
                                                    },
                                                },
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
                            orderBy: { departureTime: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!driverRecord || driverRecord.role !== 'DRIVER' || !driverRecord.driver) {
            throw new DriverError('User is not a driver or has no driver profile');
        }

        const driver = formatDriver(driverRecord.driver, driverRecord, driverRecord.driver.bus);

        let trip: Trip | null = null;
        let reservations: Reservation[] = [];
        let fuelRecords: Fuel[] = [];

        if (driverRecord.driver.bus?.id) {
            const fuels = await db.fuel.findMany({
                where: { busId: driverRecord.driver.bus.id },
                select: {
                    id: true,
                    busId: true,
                    fuelQuantity: true,
                    odometerReading: true,
                    fuelPrice: true,
                    fuelFillDate: true,
                    fuelAddedBy: true,
                    fuelComments: true,
                    createdAt: true,
                    updatedAt: true,
                    bus: { select: { id: true, licensePlate: true } },
                },
                orderBy: { fuelFillDate: 'desc' },
                take: 5,
            });
            fuelRecords = fuels.map(formatFuel);
        }

        if (driverRecord.driver.trips[0]) {
            const tripRecord = driverRecord.driver.trips[0];
            trip = {
                id: tripRecord.id,
                busId: tripRecord.busId,
                driverId: tripRecord.driverId ?? undefined,
                departureCity: tripRecord.route?.pickup_point?.pickup_point ?? '',
                arrivalCity: tripRecord.route?.destinations?.[tripRecord.destinationIndex]?.destination ?? '',
                departureTime: tripRecord.departureTime,
                arrivalTime: tripRecord.arrivalTime ?? undefined,
                status: tripRecord.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
                isFullyBooked: tripRecord.isFullyBooked,
                originLatitude: tripRecord.route?.pickup_point?.pickup_latlng?.latitude ?? undefined,
                originLongitude: tripRecord.route?.pickup_point?.pickup_latlng?.longitude ?? undefined,
                destinationLatitude:
                    tripRecord.route?.destinations?.[tripRecord.destinationIndex]?.destination_latlng?.latitude ??
                    undefined,
                destinationLongitude:
                    tripRecord.route?.destinations?.[tripRecord.destinationIndex]?.destination_latlng?.longitude ??
                    undefined,
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
            reservations = tripRecord.reservations.map(formatReservation);
        }

        return { driver, trip, reservations, fuelRecords };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriverData error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch driver data: ${errorMsg}`);
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
        if (!driverId || typeof driverId !== 'string') {
            throw new DriverError('Invalid driver ID');
        }

        const authUser = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!authUser || (authUser.role !== 'DRIVER' && authUser.role !== 'ORGANIZATION')) {
            throw new DriverError('User is not authorized to fetch reservations');
        }
        if (authUser.role === 'DRIVER' && authUser.driver?.id !== driverId) {
            throw new DriverError('User is not authorized for this driver');
        }

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
                                    },
                                },
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

        if (!trip) {
            return [];
        }

        return trip.reservations.map(formatReservation);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriverReservations error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch driver reservations: ${errorMsg}`);
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
        const validatedData = driverFuelSchema.parse({ driverId, clerkId, page, pageSize });

        const authUser = await db.user.findUnique({
            where: { clerkId: validatedData.clerkId },
            include: { driver: true },
        });
        if (!authUser || (authUser.role !== 'DRIVER' && authUser.role !== 'ORGANIZATION')) {
            throw new DriverError('User is not authorized to fetch fuel records');
        }
        if (authUser.role === 'DRIVER' && authUser.driver?.id !== validatedData.driverId) {
            throw new DriverError('User is not authorized for this driver');
        }

        const driver = await db.driver.findUnique({
            where: { id: validatedData.driverId },
            include: { bus: { select: { id: true } } },
        });
        if (!driver?.bus) {
            return { fuelRecords: [], total: 0 };
        }

        const [fuelRecords, total] = await Promise.all([
            db.fuel.findMany({
                where: { busId: driver.bus.id },
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
                skip: (validatedData.page - 1) * validatedData.pageSize,
                take: validatedData.pageSize,
                orderBy: { fuelFillDate: 'desc' },
            }),
            db.fuel.count({ where: { busId: driver.bus.id } }),
        ]);

        const formattedFuelRecords = fuelRecords.map(formatFuel);
        return { fuelRecords: formattedFuelRecords, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDriverFuelRecords error: ${errorMsg}`);
        throw new DriverError(`Failed to fetch driver fuel records: ${errorMsg}`);
    }
}
