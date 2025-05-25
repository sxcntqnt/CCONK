// src/lib/prisma/dbTrips.ts
'use server';

import { db } from '@/lib/prisma';
import { Prisma, Role as RoleEnum, TripStatus, ReservationStatus } from '@prisma/client';
import { Trip, Driver, Reservation, User, Payment } from '@/utils';
import { TripWithRelations } from './dbTypes';
import { ensureRoute } from './dbUtils';
import { z } from 'zod';

// Validation Schemas
const createTripSchema = z.object({
    busId: z.string().min(1, 'Bus ID is required'),
    driverId: z.string().optional().nullable(),
    routeId: z.string().min(1, 'Route ID is required'),
    destinationIndex: z.number().int().min(0, 'Destination index must be non-negative'),
    departureTime: z.date({ message: 'Invalid departure time' }),
    arrivalTime: z.date({ message: 'Invalid arrival time' }).optional().nullable(),
    status: z.enum(Object.values(TripStatus) as [TripStatus, ...TripStatus[]]).default(TripStatus.SCHEDULED),
});

const updateTripSchema = z.object({
    busId: z.string().min(1, 'Bus ID is required').optional(),
    driverId: z.string().optional().nullable(),
    routeId: z.string().min(1, 'Route ID is required').optional(),
    destinationIndex: z.number().int().min(0, 'Destination index must be non-negative').optional(),
    departureTime: z.date({ message: 'Invalid departure time' }).optional(),
    arrivalTime: z.date({ message: 'Invalid arrival time' }).optional().nullable(),
    status: z.enum(Object.values(TripStatus) as [TripStatus, ...TripStatus[]]).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    routeId: z.string().optional(),
    busId: z.string().optional(),
    status: z.enum(Object.values(TripStatus) as [TripStatus, ...TripStatus[]]).optional(),
});

// Custom Error
export class TripError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TripError';
    }
}

// Interface for bus image type in formatTrip
interface BusImage {
    id: string;
    src: string;
    blurDataURL: string | null;
    alt: string;
}

// Helper function to format Trip data
function formatTrip(trip: TripWithRelations): Trip {
    return {
        id: trip.id,
        busId: trip.busId,
        driverId: trip.driverId ?? undefined,
        routeId: trip.routeId,
        destinationIndex: trip.destinationIndex,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime ?? undefined,
        status: trip.status,
        isFullyBooked: trip.isFullyBooked,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        bus: {
            id: trip.bus.id,
            licensePlate: trip.bus.licensePlate,
            capacity: trip.bus.capacity,
            category: trip.bus.category,
            images: trip.bus.images.map((img: BusImage) => ({
                id: img.id,
                busId: trip.busId,
                src: img.src,
                blurDataURL: img.blurDataURL ?? undefined,
                alt: img.alt,
            })),
        },
        driver: trip.driver
            ? {
                  id: trip.driver.id,
                  userId: trip.driver.userId,
                  licenseNumber: trip.driver.licenseNumber,
                  status: trip.driver.status,
                  hireDate: trip.driver.hireDate ?? undefined,
                  rating: trip.driver.rating ?? undefined,
                  profileImageUrl: trip.driver.profileImageUrl,
                  createdAt: trip.driver.createdAt,
                  updatedAt: trip.driver.updatedAt,
                  user: {
                      id: trip.driver.user.id,
                      firstName: trip.driver.user.firstName,
                      lastName: trip.driver.user.lastName,
                      email: trip.driver.user.email,
                      image: trip.driver.user.image ?? undefined,
                      role: trip.driver.user.role,
                      phoneNumber: trip.driver.user.phoneNumber ?? undefined,
                      createdAt: trip.driver.user.createdAt,
                      updatedAt: trip.driver.user.updatedAt,
                      clerkId: trip.driver.user.clerkId,
                  },
              }
            : undefined,
        reservations:
            trip.reservations?.map((reservation) => ({
                id: reservation.id,
                userId: reservation.userId,
                tripId: trip.id,
                seatId: reservation.seatId,
                status: reservation.status,
                bookedAt: reservation.bookedAt,
                successfulPaymentId: reservation.successfulPaymentId ?? undefined,
                updatedAt: reservation.updatedAt,
                user: {
                    id: reservation.user.id,
                    firstName: reservation.user.firstName,
                    lastName: reservation.user.lastName,
                    email: reservation.user.email,
                    image: reservation.user.image ?? undefined,
                    role: reservation.user.role,
                    phoneNumber: reservation.user.phoneNumber ?? undefined,
                    createdAt: reservation.user.createdAt,
                    updatedAt: reservation.user.updatedAt,
                    clerkId: reservation.user.clerkId,
                },
                seat: {
                    id: reservation.seat.id,
                    seatNumber: reservation.seat.seatNumber,
                    price: reservation.seat.price,
                    row: reservation.seat.row,
                    column: reservation.seat.column,
                    category: reservation.seat.category,
                    status: reservation.seat.status,
                    busId: reservation.seat.busId,
                },
                trip: {
                    id: trip.id,
                    busId: trip.busId,
                    driverId: trip.driverId ?? undefined,
                    routeId: trip.routeId,
                    destinationIndex: trip.destinationIndex,
                    departureTime: trip.departureTime,
                    arrivalTime: trip.arrivalTime ?? undefined,
                    status: trip.status,
                    isFullyBooked: trip.isFullyBooked,
                    createdAt: trip.createdAt,
                    updatedAt: trip.updatedAt,
                },
                payments: reservation.payments.map((payment: Payment) => ({
                    id: payment.id,
                    reservationId: payment.reservationId,
                    userId: payment.userId,
                    amount: payment.amount,
                    mPesaReceiptNumber: payment.mPesaReceiptNumber ?? undefined,
                    merchantRequestId: payment.merchantRequestId ?? undefined,
                    checkoutRequestId: payment.checkoutRequestId ?? undefined,
                    resultCode: payment.resultCode ?? undefined,
                    resultDesc: payment.resultDesc ?? undefined,
                    balance: payment.balance ?? undefined,
                    phoneNumber: payment.phoneNumber,
                    status: payment.status,
                    transactionDate: payment.transactionDate ?? undefined,
                    callbackMetadata: payment.callbackMetadata ?? undefined,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                })),
            })) ?? [],
    };
}

// Create Trip (updated include statement)
export async function createTrip({
    busId,
    driverId,
    routeId,
    destinationIndex,
    departureTime,
    arrivalTime,
    status = TripStatus.SCHEDULED,
    clerkId,
}: {
    busId: string;
    driverId?: string | null;
    routeId?: string;
    destinationIndex?: number;
    departureTime: Date;
    arrivalTime?: Date | null;
    status?: TripStatus;
    clerkId: string;
}): Promise<Trip> {
    return await db.$transaction(async (tx) => {
        try {
            const finalRouteId = routeId ?? (await ensureRoute('Nairobi', 'Mombasa'));
            const finalDestinationIndex = destinationIndex ?? 0;

            const validatedData = createTripSchema.parse({
                busId,
                driverId,
                routeId: finalRouteId,
                destinationIndex: finalDestinationIndex,
                departureTime,
                arrivalTime,
                status,
            });

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.ORGANIZATION)) {
                throw new TripError('User is not authorized to create trips');
            }

            const bus = await tx.bus.findUnique({
                where: { id: validatedData.busId },
                include: { seats: { select: { id: true, status: true } } },
            });
            if (!bus) {
                throw new TripError(`Bus with ID ${validatedData.busId} not found`);
            }
            if (user.role === RoleEnum.OWNER && user.owner?.id !== bus.ownerId) {
                throw new TripError('User does not own this bus');
            }

            if (validatedData.driverId) {
                const driver = await tx.driver.findUnique({
                    where: { id: validatedData.driverId },
                    select: { id: true, status: true },
                });
                if (!driver) {
                    throw new TripError(`Driver with ID ${validatedData.driverId} not found`);
                }
                if (driver.status !== 'ACTIVE') {
                    throw new TripError('Driver is not active');
                }
            }

            if (validatedData.arrivalTime && validatedData.arrivalTime <= validatedData.departureTime) {
                throw new TripError('Arrival time must be after departure time');
            }

            const trip = await tx.trip.create({
                data: {
                    busId: validatedData.busId,
                    driverId: validatedData.driverId ?? null,
                    routeId: validatedData.routeId,
                    destinationIndex: validatedData.destinationIndex,
                    departureTime: validatedData.departureTime,
                    arrivalTime: validatedData.arrivalTime ?? null,
                    status: validatedData.status,
                    isFullyBooked: false,
                },
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                        },
                    },
                    bus: {
                        select: {
                            id: true,
                            licensePlate: true,
                            capacity: true,
                            category: true,
                            images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                        },
                    },
                    reservations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                            seat: true,
                            payments: true,
                        },
                    },
                    notifications: {
                        select: {
                            id: true,
                            type: true,
                            message: true,
                            status: true,
                            createdAt: true,
                            sentAt: true,
                            subject: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            reservationId: true,
                            senderId: true,
                            receiverId: true,
                            content: true,
                            timestamp: true,
                        },
                    },
                    trackingRecords: {
                        select: {
                            id: true,
                            tripId: true,
                            time: true,
                            latitude: true,
                            longitude: true,
                            altitude: true,
                            speed: true,
                            bearing: true,
                            accuracy: true,
                            provider: true,
                            comment: true,
                            createdAt: true,
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
                },
            });

            console.log(`Trip ${trip.id} created for bus ${validatedData.busId} by ${clerkId}`);
            return formatTrip(trip);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`createTrip error: ${errorMsg}`);
            throw new TripError(`Failed to create trip: ${errorMsg}`);
        }
    });
}

// Get Trip by ID (updated include statement)
export async function getTripById({ tripId, clerkId }: { tripId: string; clerkId: string }): Promise<Trip> {
    try {
        if (!tripId) {
            throw new TripError('Invalid trip ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true, driver: true },
        });
        if (
            !user ||
            (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.DRIVER && user.role !== RoleEnum.ORGANIZATION)
        ) {
            throw new TripError('User is not authorized to fetch trip');
        }

        const trip = await db.trip.findUnique({
            where: { id: tripId },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                image: true,
                                role: true,
                                phoneNumber: true,
                                createdAt: true,
                                updatedAt: true,
                                clerkId: true,
                            },
                        },
                    },
                },
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                    },
                },
                reservations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                phoneNumber: true,
                                createdAt: true,
                                updatedAt: true,
                                clerkId: true,
                            },
                        },
                        seat: true,
                        payments: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                messages: {
                    select: {
                        id: true,
                        reservationId: true,
                        senderId: true,
                        receiverId: true,
                        content: true,
                        timestamp: true,
                    },
                },
                trackingRecords: {
                    select: {
                        id: true,
                        tripId: true,
                        time: true,
                        latitude: true,
                        longitude: true,
                        altitude: true,
                        speed: true,
                        bearing: true,
                        accuracy: true,
                        provider: true,
                        comment: true,
                        createdAt: true,
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
            },
        });

        if (!trip) {
            throw new TripError(`Trip with ID ${tripId} not found`);
        }

        if (user.role === RoleEnum.OWNER) {
            const bus = await db.bus.findUnique({
                where: { id: trip.busId },
                select: { ownerId: true },
            });
            if (user.owner?.id !== bus?.ownerId) {
                throw new TripError('User does not own this trip’s bus');
            }
        } else if (user.role === RoleEnum.DRIVER && user.driver?.id !== trip.driverId) {
            throw new TripError('Driver is not assigned to this trip');
        }

        return formatTrip(trip);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getTripById error: ${errorMsg}`);
        throw new TripError(`Failed to fetch trip: ${errorMsg}`);
    }
}

// Get Trips (updated include statement)
export async function getTrips({
    ownerId,
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
    clerkId,
}: {
    ownerId?: string;
    driverId?: string;
    page?: number;
    pageSize?: number;
    filters?: {
        routeId?: string;
        busId?: string;
        status?: TripStatus;
    };
    clerkId: string;
}): Promise<{ trips: Trip[]; total: number }> {
    try {
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);
        if (!clerkId) {
            throw new TripError('Clerk ID is required');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true, driver: true },
        });
        if (
            !user ||
            (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.DRIVER && user.role !== RoleEnum.ORGANIZATION)
        ) {
            throw new TripError('User is not authorized to fetch trips');
        }

        const where: Prisma.TripWhereInput = {
            ...(ownerId && { bus: { ownerId } }),
            ...(driverId && { driverId, status: { not: TripStatus.COMPLETED } }),
            ...(validatedFilters.routeId && { routeId: validatedFilters.routeId }),
            ...(validatedFilters.busId && { busId: validatedFilters.busId }),
            ...(validatedFilters.status && { status: validatedFilters.status }),
        };

        if (user.role === RoleEnum.OWNER) {
            where.bus = { ownerId: user.owner?.id };
        } else if (user.role === RoleEnum.DRIVER) {
            where.driverId = user.driver?.id;
        }

        const [trips, total] = await Promise.all([
            db.trip.findMany({
                where,
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                        },
                    },
                    bus: {
                        select: {
                            id: true,
                            licensePlate: true,
                            capacity: true,
                            category: true,
                            images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                        },
                    },
                    reservations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                            seat: true,
                            payments: true,
                        },
                    },
                    notifications: {
                        select: {
                            id: true,
                            type: true,
                            message: true,
                            status: true,
                            createdAt: true,
                            sentAt: true,
                            subject: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            reservationId: true,
                            senderId: true,
                            receiverId: true,
                            content: true,
                            timestamp: true,
                        },
                    },
                    trackingRecords: {
                        select: {
                            id: true,
                            tripId: true,
                            time: true,
                            latitude: true,
                            longitude: true,
                            altitude: true,
                            speed: true,
                            bearing: true,
                            accuracy: true,
                            provider: true,
                            comment: true,
                            createdAt: true,
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
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { departureTime: driverId ? 'asc' : 'desc' },
            }),
            db.trip.count({ where }),
        ]);

        return { trips: trips.map(formatTrip), total };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getTrips error: ${errorMsg}`);
        throw new TripError(`Failed to fetch trips: ${errorMsg}`);
    }
}

// Update Trip (updated include statement)
export async function updateTrip(
    clerkId: string,
    tripId: string,
    data: {
        busId?: string;
        driverId?: string | null;
        routeId?: string;
        destinationIndex?: number;
        departureTime?: Date;
        arrivalTime?: Date | null;
        status?: TripStatus;
    },
): Promise<Trip> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = updateTripSchema.parse(data);
            if (!tripId) {
                throw new TripError('Invalid trip ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.ORGANIZATION)) {
                throw new TripError('User is not authorized to update trips');
            }

            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: {
                    bus: { select: { id: true, ownerId: true } },
                    reservations: { select: { id: true, status: true } },
                },
            });
            if (!trip) {
                throw new TripError(`Trip with ID ${tripId} not found`);
            }
            if (user.role === RoleEnum.OWNER && user.owner?.id !== trip.bus.ownerId) {
                throw new TripError('User does not own this trip’s bus');
            }

            if (trip.status === TripStatus.CANCELLED || trip.status === TripStatus.COMPLETED) {
                throw new TripError(`Cannot update trip with status ${trip.status}`);
            }

            if (
                trip.reservations.some((r: { status: string }) => r.status === 'CONFIRMED') &&
                validatedData.busId &&
                validatedData.busId !== trip.busId
            ) {
                throw new TripError('Cannot change bus for trip with confirmed reservations');
            }

            if (validatedData.busId) {
                const bus = await tx.bus.findUnique({
                    where: { id: validatedData.busId },
                    select: { ownerId: true },
                });
                if (!bus) {
                    throw new TripError(`Bus with ID ${validatedData.busId} not found`);
                }
                if (user.role === RoleEnum.OWNER && user.owner?.id !== bus.ownerId) {
                    throw new TripError('User does not own this bus');
                }
            }

            if (validatedData.driverId) {
                const driver = await tx.driver.findUnique({
                    where: { id: validatedData.driverId },
                    select: { id: true, status: true },
                });
                if (!driver) {
                    throw new TripError(`Driver with ID ${validatedData.driverId} not found`);
                }
                if (driver.status !== 'ACTIVE') {
                    throw new TripError('Driver is not active');
                }
            }

            const departureTime = validatedData.departureTime ?? trip.departureTime;
            const arrivalTime = validatedData.arrivalTime ?? trip.arrivalTime;
            if (arrivalTime && departureTime && arrivalTime <= departureTime) {
                throw new TripError('Arrival time must be after departure time');
            }

            const updatedTrip = await tx.trip.update({
                where: { id: tripId },
                data: {
                    busId: validatedData.busId ?? undefined,
                    driverId: validatedData.driverId ?? null,
                    routeId: validatedData.routeId ?? undefined,
                    destinationIndex: validatedData.destinationIndex ?? undefined,
                    departureTime: validatedData.departureTime ?? undefined,
                    arrivalTime: validatedData.arrivalTime ?? null,
                    status: validatedData.status ?? undefined,
                },
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                        },
                    },
                    bus: {
                        select: {
                            id: true,
                            licensePlate: true,
                            capacity: true,
                            category: true,
                            images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                        },
                    },
                    reservations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                            seat: true,
                            payments: true,
                        },
                    },
                    notifications: {
                        select: {
                            id: true,
                            type: true,
                            message: true,
                            status: true,
                            createdAt: true,
                            sentAt: true,
                            subject: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            reservationId: true,
                            senderId: true,
                            receiverId: true,
                            content: true,
                            timestamp: true,
                        },
                    },
                    trackingRecords: {
                        select: {
                            id: true,
                            tripId: true,
                            time: true,
                            latitude: true,
                            longitude: true,
                            altitude: true,
                            speed: true,
                            bearing: true,
                            accuracy: true,
                            provider: true,
                            comment: true,
                            createdAt: true,
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
                },
            });

            console.log(`Trip ${tripId} updated by ${clerkId}`);
            return formatTrip(updatedTrip);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`updateTrip error: ${errorMsg}`);
            throw new TripError(`Failed to update trip: ${errorMsg}`);
        }
    });
}

// Delete (Cancel) Trip (unchanged, included for completeness)
export async function deleteTrip(clerkId: string, tripId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            if (!tripId) {
                throw new TripError('Invalid trip ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true, organization: true },
            });
            if (!user || (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.ORGANIZATION)) {
                throw new TripError('User is not authorized to cancel trips');
            }

            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: {
                    bus: { select: { ownerId: true } },
                    reservations: { select: { id: true, status: true, seatId: true } },
                },
            });
            if (!trip) {
                throw new TripError(`Trip with ID ${tripId} not found`);
            }
            if (user.role === RoleEnum.OWNER && user.owner?.id !== trip.bus.ownerId) {
                throw new TripError('User does not own this trip’s bus');
            }

            if (trip.status === TripStatus.COMPLETED) {
                throw new TripError('Cannot cancel a completed trip');
            }

            for (const reservation of trip.reservations) {
                if (reservation.status === 'CONFIRMED') {
                    await tx.reservation.update({
                        where: { id: reservation.id },
                        data: { status: 'CANCELLED' },
                    });
                    await tx.seat.update({
                        where: { id: reservation.seatId },
                        data: { status: 'AVAILABLE' },
                    });
                    const ownerId = user.role === RoleEnum.OWNER ? user.owner?.id : trip.bus.ownerId;
                    if (!ownerId) {
                        throw new TripError('Owner ID is missing for refund');
                    }
                    await tx.incomeExpense.create({
                        data: {
                            ownerId,
                            amount: -100, // Placeholder refund
                            type: 'EXPENSE',
                            description: `Refund for cancelled trip ${tripId}`,
                        },
                    });
                }
            }

            await tx.trip.update({
                where: { id: tripId },
                data: { status: TripStatus.CANCELLED, isFullyBooked: false },
            });

            console.log(`Trip ${tripId} cancelled by ${clerkId}`);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`deleteTrip error: ${errorMsg}`);
            throw new TripError(`Failed to cancel trip: ${errorMsg}`);
        }
    });
}

// Get Active Trips for Driver (updated include statement)
export async function getActiveTripsForDriver({
    driverId,
    clerkId,
}: {
    driverId: string;
    clerkId: string;
}): Promise<Trip[]> {
    try {
        if (!driverId) {
            throw new TripError('Invalid driver ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== RoleEnum.DRIVER && user.role !== RoleEnum.ORGANIZATION)) {
            throw new TripError('User is not authorized to fetch active trips');
        }
        if (user.role === RoleEnum.DRIVER && user.driver?.id !== driverId) {
            throw new TripError('User is not authorized for this driver');
        }

        const trips = await db.trip.findMany({
            where: { driverId, status: TripStatus.IN_PROGRESS },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                image: true,
                                role: true,
                                phoneNumber: true,
                                createdAt: true,
                                updatedAt: true,
                                clerkId: true,
                            },
                        },
                    },
                },
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                    },
                },
                reservations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                phoneNumber: true,
                                createdAt: true,
                                updatedAt: true,
                                clerkId: true,
                            },
                        },
                        seat: true,
                        payments: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                messages: {
                    select: {
                        id: true,
                        reservationId: true,
                        senderId: true,
                        receiverId: true,
                        content: true,
                        timestamp: true,
                    },
                },
                trackingRecords: {
                    select: {
                        id: true,
                        tripId: true,
                        time: true,
                        latitude: true,
                        longitude: true,
                        altitude: true,
                        speed: true,
                        bearing: true,
                        accuracy: true,
                        provider: true,
                        comment: true,
                        createdAt: true,
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
            },
        });

        return trips.map(formatTrip);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getActiveTripsForDriver error: ${errorMsg}`);
        throw new TripError(`Failed to fetch active trips: ${errorMsg}`);
    }
}

// Get Trip ID for Driver (unchanged)
export async function getTripIdForDriver({
    driverId,
    clerkId,
}: {
    driverId: string;
    clerkId: string;
}): Promise<string> {
    try {
        if (!driverId) {
            throw new TripError('Invalid driver ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== RoleEnum.DRIVER && user.role !== RoleEnum.ORGANIZATION)) {
            throw new TripError('User is not authorized to fetch trip ID');
        }
        if (user.role === RoleEnum.DRIVER && user.driver?.id !== driverId) {
            throw new TripError('User is not authorized for this driver');
        }

        const trip = await db.trip.findFirst({
            where: { driverId, status: TripStatus.IN_PROGRESS },
            select: { id: true },
        });

        if (!trip) {
            throw new TripError('No active trip found for driver');
        }

        return trip.id;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getTripIdForDriver error: ${errorMsg}`);
        throw new TripError(`Failed to fetch trip ID: ${errorMsg}`);
    }
}

// Update Trip Status (updated include statement)
export async function updateTripStatus({
    tripId,
    status,
    clerkId,
}: {
    tripId: string;
    status: TripStatus;
    clerkId: string;
}): Promise<Trip> {
    return await db.$transaction(async (tx) => {
        try {
            if (!tripId) {
                throw new TripError('Invalid trip ID');
            }
            if (!Object.values(TripStatus).includes(status)) {
                throw new TripError(`Invalid trip status: ${status}`);
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true, driver: true },
            });
            if (
                !user ||
                (user.role !== RoleEnum.OWNER && user.role !== RoleEnum.DRIVER && user.role !== RoleEnum.ORGANIZATION)
            ) {
                throw new TripError('User is not authorized to update trip status');
            }

            const trip = await tx.trip.findUnique({
                where: { id: tripId },
                include: { bus: { select: { ownerId: true } } },
            });
            if (!trip) {
                throw new TripError(`Trip with ID ${tripId} not found`);
            }

            if (user.role === RoleEnum.OWNER && user.owner?.id !== trip.bus.ownerId) {
                throw new TripError('User does not own this trip’s bus');
            } else if (user.role === RoleEnum.DRIVER && user.driver?.id !== trip.driverId) {
                throw new TripError('Driver is not assigned to this trip');
            }

            if (trip.status === TripStatus.CANCELLED || trip.status === TripStatus.COMPLETED) {
                throw new TripError(`Cannot change status of a ${trip.status} trip`);
            }

            const updatedTrip = await tx.trip.update({
                where: { id: tripId },
                data: { status },
                include: {
                    driver: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                        },
                    },
                    bus: {
                        select: {
                            id: true,
                            licensePlate: true,
                            capacity: true,
                            category: true,
                            images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                        },
                    },
                    reservations: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    role: true,
                                    phoneNumber: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    clerkId: true,
                                },
                            },
                            seat: true,
                            payments: true,
                        },
                    },
                    notifications: {
                        select: {
                            id: true,
                            type: true,
                            message: true,
                            status: true,
                            createdAt: true,
                            sentAt: true,
                            subject: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            reservationId: true,
                            senderId: true,
                            receiverId: true,
                            content: true,
                            timestamp: true,
                        },
                    },
                    trackingRecords: {
                        select: {
                            id: true,
                            tripId: true,
                            time: true,
                            latitude: true,
                            longitude: true,
                            altitude: true,
                            speed: true,
                            bearing: true,
                            accuracy: true,
                            provider: true,
                            comment: true,
                            createdAt: true,
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
                },
            });

            console.log(`Trip ${tripId} status updated to ${status} by ${clerkId}`);
            return formatTrip(updatedTrip);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`updateTripStatus error: ${errorMsg}`);
            throw new TripError(`Failed to update trip status: ${errorMsg}`);
        }
    });
}

// Update Trip Status Action (unchanged)
export async function updateTripStatusAction({
    tripId,
    driverId,
    status,
    clerkId,
}: {
    tripId: string;
    driverId: string;
    status: TripStatus;
    clerkId: string;
}): Promise<{ success: boolean }> {
    try {
        const activeTripId = await getTripIdForDriver({ driverId, clerkId });
        if (activeTripId !== tripId) {
            throw new TripError('Trip ID mismatch or no active trip found');
        }

        await updateTripStatus({ tripId, status, clerkId });
        return { success: true };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`updateTripStatusAction error: ${errorMsg}`);
        throw new TripError(`Failed to update trip status action: ${errorMsg}`);
    }
}
