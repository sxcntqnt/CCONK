'use server';

import { db } from '@/lib/prisma';
import { MatatuCapacity, matatuConfigs, validateCapacity } from '@/utils/constants/matatuSeats';
import { ROLES } from '@/utils/constants/roles';
import { SeatData, Bus } from '@/utils';
import { Prisma, SeatStatus, SeatCategory } from '@prisma/client';
import { z } from 'zod';
import { parseISO, isValid } from 'date-fns';
import { SeatWithRelations } from './dbTypes';

// Validation Schemas
const seatSchema = z.object({
    busId: z.string().min(1, 'Bus ID is required'),
    seatNumber: z.number().positive('Seat number must be a positive number'),
    price: z
        .number()
        .positive('Price must be positive')
        .default(Number(process.env.DEFAULT_SEAT_PRICE) || 19),
    row: z.number().positive('Row must be a positive number'),
    column: z.number().positive('Column must be a positive number'),
    category: z.nativeEnum(SeatCategory).default(SeatCategory.middle),
    status: z.nativeEnum(SeatStatus).default(SeatStatus.AVAILABLE),
});

const updateSeatSchema = z.object({
    seatNumber: z.number().positive('Seat number must be a positive number').optional(),
    price: z.number().positive('Price must be positive').optional(),
    row: z.number().positive('Row must be a positive number').optional(),
    column: z.number().positive('Column must be a positive number').optional(),
    category: z.nativeEnum(SeatCategory).optional(),
    status: z.nativeEnum(SeatStatus).optional(),
});

const driverTripSchema = z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

const availableSeatsSchema = z.object({
    routeId: z.string().min(1, 'Route ID is required'),
    departureTime: z.string().refine((val) => isValid(parseISO(val)), { message: 'Invalid departure time' }),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

const seatReservationSchema = z.object({
    seatId: z.string().min(1, 'Seat ID is required'),
    tripId: z.string().min(1, 'Trip ID is required'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

// Custom Error
class SeatError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SeatError';
    }
}

// Helper function to build seat map
async function buildSeatMap(
    seats: SeatWithRelations[],
    totalSeats: number,
    includeUserData: boolean = false,
): Promise<Record<string, SeatData>> {
    const seatMap: Record<string, SeatData> = {};

    // Fetch user data only if needed (e.g., for owners viewing reservations)
    const userIds = includeUserData ? seats.flatMap((seat) => seat.reservations.map((r) => r.userId)) : [];
    const users =
        includeUserData && userIds.length > 0
            ? await db.user.findMany({
                  where: { id: { in: userIds } },
                  select: { id: true, name: true, email: true },
              })
            : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    seats.forEach((seat) => {
        const activeReservation = seat.reservations.find((r) => r.tripId);
        seatMap[seat.id] = {
            id: seat.id,
            busId: seat.busId,
            label: String(seat.seatNumber),
            status: seat.status,
            price: seat.price,
            row: seat.row,
            column: seat.column,
            category: seat.category,
            reservation: activeReservation
                ? {
                      id: activeReservation.id,
                      tripId: activeReservation.tripId,
                      user: {
                          id: activeReservation.userId,
                          name: includeUserData ? userMap.get(activeReservation.userId)?.name || '' : '',
                          email: includeUserData ? userMap.get(activeReservation.userId)?.email || '' : '',
                      },
                      status: activeReservation.status,
                  }
                : undefined,
        };
    });

    return seatMap;
}

// Helper function to determine seat category
function determineSeatCategory(rowIndex: number, columnIndex: number, rowLength: number): SeatCategory {
    if (rowLength === 1) return SeatCategory.single;
    if (columnIndex === 0 || columnIndex === rowLength - 1) return SeatCategory.window;
    if (columnIndex === 1 || columnIndex === rowLength - 2) return SeatCategory.aisle;
    return SeatCategory.middle;
}

// Initialize Seats
export async function initializeSeats(busId: string, capacity: MatatuCapacity): Promise<void> {
    const config = matatuConfigs[capacity];
    if (!config || !Array.isArray(config.layout)) {
        throw new SeatError(`Invalid configuration or layout for capacity ${capacity}`);
    }

    const seatsToCreate = config.layout.flatMap((row: number[][], rowIndex: number) =>
        row
            .flat()
            .filter(Boolean)
            .map((seatNumber: number, seatIndex: number) => ({
                busId,
                seatNumber,
                price: Number(process.env.DEFAULT_SEAT_PRICE) || 19,
                row: rowIndex + 1,
                column: seatIndex + 1,
                category: determineSeatCategory(rowIndex, seatIndex, row.flat().length),
                status: SeatStatus.AVAILABLE,
                createdAt: new Date(),
                updatedAt: new Date(),
            })),
    );

    await db.$transaction(async (tx) => {
        await tx.seat.createMany({
            data: seatsToCreate,
            skipDuplicates: true,
        });
    });
}

// Get Seats (Owner/Organization)
export async function getSeats(busId: string, clerkId: string): Promise<Record<string, SeatData>> {
    try {
        if (!busId) {
            throw new SeatError('Bus ID is required');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ORGANIZATION)) {
            throw new SeatError('User is not authorized to fetch seats');
        }
        const bus = await db.bus.findUnique({
            where: { id: busId },
            select: { ownerId: true, category: true },
        });
        if (!bus) {
            throw new SeatError(`Bus with ID ${busId} not found`);
        }
        if (user.role === ROLES.OWNER && user.owner?.id !== bus.ownerId) {
            throw new SeatError('User does not own this bus');
        }

        const busWithSeats = await db.bus.findUnique({
            where: { id: busId },
            select: {
                capacity: true,
                category: true,
                seats: {
                    include: {
                        bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                        reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                    },
                },
            },
        });

        if (!busWithSeats) {
            throw new SeatError(`Bus with ID ${busId} not found`);
        }

        const dbCapacity = validateCapacity(busWithSeats.category);
        if (!(dbCapacity in matatuConfigs)) {
            throw new SeatError(
                `Unsupported bus capacity: ${dbCapacity}. Supported capacities: ${Object.keys(matatuConfigs).join(', ')}`,
            );
        }

        const { totalSeats } = matatuConfigs[dbCapacity];

        if (busWithSeats.seats.length === 0) {
            await initializeSeats(busId, dbCapacity);
            const updatedBusWithSeats = await db.bus.findUnique({
                where: { id: busId },
                select: {
                    seats: {
                        include: {
                            bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                            reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                        },
                    },
                },
            });
            return await buildSeatMap((updatedBusWithSeats?.seats as SeatWithRelations[]) || [], totalSeats, true);
        }

        return await buildSeatMap(busWithSeats.seats as SeatWithRelations[], totalSeats, true);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getSeats error: ${errorMsg}`);
        throw new SeatError(`Failed to fetch seats: ${errorMsg}`);
    }
}

// Get Available Seats for Trip (Passenger)
export async function getAvailableSeatsForTrip({
    routeId,
    departureTime,
    clerkId,
}: {
    routeId: string;
    departureTime: string;
    clerkId: string;
}): Promise<SeatData[]> {
    try {
        const validatedData = availableSeatsSchema.parse({ routeId, departureTime, clerkId });

        const user = await db.user.findUnique({
            where: { clerkId: validatedData.clerkId },
        });
        if (!user) {
            throw new SeatError('User not found');
        }

        const trip = await db.trip.findFirst({
            where: {
                routeId: validatedData.routeId,
                departureTime: parseISO(validatedData.departureTime),
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
                isFullyBooked: false,
            },
            select: { id: true, busId: true },
        });

        if (!trip) {
            throw new SeatError('No active trip found for the specified route and departure time');
        }

        const seats = (await db.seat.findMany({
            where: {
                busId: trip.busId,
                status: SeatStatus.AVAILABLE,
            },
            include: {
                bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                reservations: { select: { id: true, tripId: true, userId: true, status: true } },
            },
        })) as SeatWithRelations[];

        const bus = await db.bus.findUnique({
            where: { id: trip.busId },
            select: { category: true },
        });
        const dbCapacity = validateCapacity(bus?.category || 'CAPACITY_14');
        const { totalSeats } = matatuConfigs[dbCapacity];

        return Object.values(await buildSeatMap(seats, totalSeats));
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getAvailableSeatsForTrip error: ${errorMsg}`);
        throw new SeatError(`Failed to fetch available seats: ${errorMsg}`);
    }
}

// Select Seat for Reservation (Passenger)
export async function selectSeatForReservation({
    seatId,
    tripId,
    clerkId,
}: {
    seatId: string;
    tripId: string;
    clerkId: string;
}): Promise<SeatData> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = seatReservationSchema.parse({ seatId, tripId, clerkId });

            const user = await tx.user.findUnique({
                where: { clerkId: validatedData.clerkId },
            });
            if (!user) {
                throw new SeatError('User not found');
            }

            const seat = (await tx.seat.findUnique({
                where: { id: validatedData.seatId },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: {
                        where: { tripId: validatedData.tripId },
                        select: { id: true, tripId: true, userId: true, status: true },
                    },
                },
            })) as SeatWithRelations | null;

            if (!seat) {
                throw new SeatError(`Seat with ID ${validatedData.seatId} not found`);
            }

            const trip = await tx.trip.findUnique({
                where: { id: validatedData.tripId },
                select: { busId: true },
            });

            if (!trip || trip.busId !== seat.busId) {
                throw new SeatError(`Seat does not belong to the trip's bus`);
            }

            if (seat.status !== SeatStatus.AVAILABLE || seat.reservations.length > 0) {
                throw new SeatError('Seat is not available for this trip');
            }

            // Mark seat as SELECTED
            await tx.seat.update({
                where: { id: validatedData.seatId },
                data: { status: SeatStatus.SELECTED },
            });

            // Create a pending reservation
            const reservation = await tx.reservation.create({
                data: {
                    userId: user.id,
                    tripId: validatedData.tripId,
                    seatId: validatedData.seatId,
                    status: 'PENDING',
                    bookedAt: new Date(),
                },
            });

            const bus = await tx.bus.findUnique({
                where: { id: seat.busId },
                select: { category: true },
            });
            const dbCapacity = validateCapacity(bus?.category || 'CAPACITY_14');
            const { totalSeats } = matatuConfigs[dbCapacity];

            const updatedSeat = (await tx.seat.findUnique({
                where: { id: validatedData.seatId },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                },
            })) as SeatWithRelations;

            return (await buildSeatMap([updatedSeat], totalSeats))[updatedSeat.id];
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`selectSeatForReservation error: ${errorMsg}`);
            throw new SeatError(`Failed to select seat for reservation: ${errorMsg}`);
        }
    });
}

// Create Seat (Owner/Organization)
export async function createSeat({
    busId,
    seatNumber,
    price,
    row,
    column,
    category,
    status,
    clerkId,
}: {
    busId: string;
    seatNumber: number;
    price?: number;
    row: number;
    column: number;
    category?: SeatCategory;
    status?: SeatStatus;
    clerkId: string;
}): Promise<SeatData> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = seatSchema.parse({ busId, seatNumber, price, row, column, category, status });

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ORGANIZATION)) {
                throw new SeatError('User is not authorized to create seats');
            }

            const bus = await tx.bus.findUnique({
                where: { id: validatedData.busId },
                select: { ownerId: true, category: true },
            });
            if (!bus) {
                throw new SeatError(`Bus with ID ${validatedData.busId} not found`);
            }
            if (user.role === ROLES.OWNER && user.owner?.id !== bus.ownerId) {
                throw new SeatError('User does not own this bus');
            }

            const dbCapacity = validateCapacity(bus.category);
            if (!(dbCapacity in matatuConfigs)) {
                throw new SeatError(
                    `Unsupported bus capacity: ${dbCapacity}. Supported capacities: ${Object.keys(matatuConfigs).join(', ')}`,
                );
            }

            const existingSeat = await tx.seat.findFirst({
                where: { busId: validatedData.busId, seatNumber: validatedData.seatNumber },
            });
            if (existingSeat) {
                throw new SeatError(
                    `Seat number ${validatedData.seatNumber} already exists for bus ${validatedData.busId}`,
                );
            }

            const seat = (await tx.seat.create({
                data: {
                    busId: validatedData.busId,
                    seatNumber: validatedData.seatNumber,
                    price: validatedData.price,
                    row: validatedData.row,
                    column: validatedData.column,
                    category: validatedData.category,
                    status: validatedData.status,
                },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                },
            })) as SeatWithRelations;

            console.log(`Seat ${seat.id} created for bus ${validatedData.busId} by ${clerkId}`);
            return (await buildSeatMap([seat], 1))[seat.id];
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`createSeat error: ${errorMsg}`);
            throw new SeatError(`Failed to create seat: ${errorMsg}`);
        }
    });
}

// Get Seat by ID (Owner/Organization)
export async function getSeatById({ seatId, clerkId }: { seatId: string; clerkId: string }): Promise<SeatData> {
    try {
        if (!seatId) {
            throw new SeatError('Invalid seat ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ORGANIZATION)) {
            throw new SeatError('User is not authorized to fetch seat');
        }

        const seat = (await db.seat.findUnique({
            where: { id: seatId },
            include: {
                bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                reservations: { select: { id: true, tripId: true, userId: true, status: true } },
            },
        })) as SeatWithRelations | null;

        if (!seat) {
            throw new SeatError(`Seat with ID ${seatId} not found`);
        }

        if (user.role === ROLES.OWNER && user.owner?.id !== seat.bus.ownerId) {
            throw new SeatError('User does not own this seat’s bus');
        }

        return (await buildSeatMap([seat], 1, true))[seat.id];
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getSeatById error: ${errorMsg}`);
        throw new SeatError(`Failed to fetch seat: ${errorMsg}`);
    }
}

// Update Seat (Owner/Organization)
export async function updateSeat(
    seatId: string,
    data: Partial<{
        seatNumber: number;
        price: number;
        row: number;
        column: number;
        category: SeatCategory;
        status: SeatStatus;
    }>,
    clerkId: string,
): Promise<SeatData> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = updateSeatSchema.parse(data);
            if (!seatId) {
                throw new SeatError('Invalid seat ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ORGANIZATION)) {
                throw new SeatError('User is not authorized to update seats');
            }

            const seat = (await tx.seat.findUnique({
                where: { id: seatId },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                },
            })) as SeatWithRelations | null;

            if (!seat) {
                throw new SeatError(`Seat with ID ${seatId} not found`);
            }
            if (user.role === ROLES.OWNER && user.owner?.id !== seat.bus.ownerId) {
                throw new SeatError('User does not own this seat’s bus');
            }

            if (seat.reservations.length > 0 && validatedData.status === SeatStatus.AVAILABLE) {
                throw new SeatError('Cannot set seat to AVAILABLE with active reservations');
            }

            if (validatedData.seatNumber) {
                const existingSeat = await tx.seat.findFirst({
                    where: { busId: seat.busId, seatNumber: validatedData.seatNumber, id: { not: seatId } },
                });
                if (existingSeat) {
                    throw new SeatError(`Seat number ${validatedData.seatNumber} already exists for bus ${seat.busId}`);
                }
            }

            const updatedSeat = (await tx.seat.update({
                where: { id: seatId },
                data: {
                    seatNumber: validatedData.seatNumber ?? undefined,
                    price: validatedData.price ?? undefined,
                    row: validatedData.row ?? undefined,
                    column: validatedData.column ?? undefined,
                    category: validatedData.category ?? undefined,
                    status: validatedData.status ?? undefined,
                },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                },
            })) as SeatWithRelations;

            console.log(`Seat ${seatId} updated by ${clerkId}`);
            return (await buildSeatMap([updatedSeat], 1, true))[updatedSeat.id];
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`updateSeat error: ${errorMsg}`);
            throw new SeatError(`Failed to update seat: ${errorMsg}`);
        }
    });
}

// Delete Seat (Owner/Organization)
export async function deleteSeat(seatId: string, clerkId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            if (!seatId) {
                throw new SeatError('Invalid seat ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || (user.role !== ROLES.OWNER && user.role !== ROLES.ORGANIZATION)) {
                throw new SeatError('User is not authorized to delete seats');
            }

            const seat = (await tx.seat.findUnique({
                where: { id: seatId },
                include: {
                    bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                    reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                },
            })) as SeatWithRelations | null;

            if (!seat) {
                throw new SeatError(`Seat with ID ${seatId} not found`);
            }
            if (user.role === ROLES.OWNER && user.owner?.id !== seat.bus.ownerId) {
                throw new SeatError('User does not own this seat’s bus');
            }

            if (seat.reservations.length > 0) {
                throw new SeatError('Cannot delete seat with active reservations');
            }

            await tx.seat.delete({
                where: { id: seatId },
            });

            console.log(`Seat ${seatId} deleted by ${clerkId}`);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`deleteSeat error: ${errorMsg}`);
            throw new SeatError(`Failed to delete seat: ${errorMsg}`);
        }
    });
}

// Get Seats for Driver’s Active Trip
export async function getSeatsForDriverTrip({
    driverId,
    clerkId,
}: {
    driverId: string;
    clerkId: string;
}): Promise<Record<string, SeatData>> {
    try {
        const validatedData = driverTripSchema.parse({ driverId, clerkId });

        const user = await db.user.findUnique({
            where: { clerkId: validatedData.clerkId },
            select: {
                id: true,
                role: true,
                driver: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!user || (user.role !== ROLES.DRIVER && user.role !== ROLES.ORGANIZATION)) {
            throw new SeatError('User is not authorized to fetch seats for driver');
        }
        if (user.role === ROLES.DRIVER && user.driver?.id !== validatedData.driverId) {
            throw new SeatError('User is not authorized for this driver');
        }

        const trip = await db.trip.findFirst({
            where: { driverId: validatedData.driverId, status: 'IN_PROGRESS' },
            select: {
                id: true,
                busId: true,
                bus: {
                    select: {
                        category: true,
                        seats: {
                            include: {
                                bus: { select: { id: true, licensePlate: true, capacity: true, ownerId: true } },
                                reservations: { select: { id: true, tripId: true, userId: true, status: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!trip || !trip.bus) {
            return {};
        }

        const dbCapacity = validateCapacity(trip.bus.category);
        if (!(dbCapacity in matatuConfigs)) {
            throw new SeatError(
                `Unsupported bus capacity: ${dbCapacity}. Supported capacities: ${Object.keys(matatuConfigs).join(', ')}`,
            );
        }

        const seats: SeatWithRelations[] = trip.bus.seats.map((seat) => ({
            ...seat,
            reservations: seat.reservations.filter((r) => r.tripId === trip.id),
        })) as SeatWithRelations[];

        const { totalSeats } = matatuConfigs[dbCapacity];
        return await buildSeatMap(seats, totalSeats, true);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getSeatsForDriverTrip error: ${errorMsg}`);
        throw new SeatError(`Failed to fetch seats for driver trip: ${errorMsg}`);
    }
}

// Validate Seats
export async function validateSeats(busId: string = '1'): Promise<boolean> {
    try {
        if (!busId) {
            throw new SeatError('Invalid bus ID');
        }

        const bus = await db.bus.findUnique({
            where: { id: busId },
            select: { category: true },
        });
        if (!bus) {
            throw new SeatError(`Bus with ID ${busId} not found`);
        }

        const capacity = validateCapacity(bus.category);
        if (!(capacity in matatuConfigs)) {
            return false;
        }

        const layout = matatuConfigs[capacity].layout;

        const seats = await db.seat.findMany({
            where: { busId },
            select: { seatNumber: true },
        });

        const dbSeatNumbers = new Set(seats.map((s) => s.seatNumber));
        const layoutSeatNumbers = new Set<number>(
            layout.flat(2).filter((num: number | null): num is number => num !== null),
        );

        return (
            dbSeatNumbers.size === layoutSeatNumbers.size &&
            [...layoutSeatNumbers].every((num) => dbSeatNumbers.has(num))
        );
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`validateSeats error: ${errorMsg}`);
        return false;
    }
}
