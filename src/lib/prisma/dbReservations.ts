'use server';

import { db } from '@/lib/prisma';
import { Prisma, ReservationStatus, PaymentStatus, SeatStatus, MatatuCapacity, Role } from '@prisma/client';
import { selectSeatForReservation, updateSeat } from './dbSeats';
import { z } from 'zod';
import { ReservationWithRelations } from './dbTypes';
import { ROLES } from '@/utils/constants/roles';

// Types
type User = {
    id: string;
    clerkId: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string;
    role: Role;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt: Date;
};

type Bus = {
    id: string;
    licensePlate: string;
    capacity: number;
    category: MatatuCapacity;
    createdAt: Date;
    updatedAt: Date;
    images: Image[];
    passengers?: Passenger[];
};

type Seat = {
    id: string;
    busId: string;
    seatNumber: number;
    price: number;
    row: number;
    column: number;
    category: string;
    status: SeatStatus;
    bus: Bus;
};

type Reservation = {
    id: string;
    userId: string;
    tripId: string;
    seatId: string;
    status: ReservationStatus;
    bookedAt: Date;
    updatedAt: Date;
    successfulPaymentId?: string;
    user: User;
    seat: Seat;
    trip: Trip;
    payments: Payment[];
    messages: Message[];
};

type Image = { id: string; src: string; blurDataURL?: string; alt: string; busId: string };
type Passenger = { id: string; userId: string; busId: string; createdAt: Date; updatedAt: Date; user: User };
type Trip = {
    id: string;
    busId: string;
    routeId: string;
    destinationIndex: number;
    departureTime: Date;
    status: string;
    isFullyBooked: boolean;
    createdAt: Date;
    updatedAt: Date;
    driverId?: string;
    bus: Bus;
    route?: Route;
};
type Route = {
    id: string;
    route_number: string;
    pickup_point: any;
    destinations: any[];
    helix: any;
    createdAt: Date;
    updatedAt: Date;
};
type Payment = {
    id: string;
    reservationId: string;
    userId: string;
    amount: number;
    status: PaymentStatus;
    mPesaReceiptNumber?: string;
    phoneNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    reservation: Reservation;
};
type Message = any;

// Validation Schemas
const schemas = {
    reservation: z.object({
        userId: z.string().min(1, 'User ID is required'),
        tripId: z.string().min(1, 'Trip ID is required'),
        seatId: z.string().min(1, 'Seat ID is required'),
        clerkId: z.string().min(1, 'Clerk ID is required'),
        phoneNumber: z.string().min(1, 'Phone number is required'),
    }),
    passengerReservations: z.object({
        clerkId: z.string().min(1, 'Clerk ID is required'),
    }),
    tripSearch: z.object({
        pickup: z.string().min(1, 'Pickup is required').optional(),
        destination: z.string().min(1, 'Destination is required').optional(),
    }),
    completeTrip: z.object({
        tripId: z.string().min(1, 'Trip ID is required'),
        clerkId: z.string().min(1, 'Clerk ID is required'),
    }),
};

// Common Prisma Include Configuration
const reservationInclude: Prisma.ReservationInclude = {
    user: {
        select: {
            id: true,
            clerkId: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            role: true,
            phoneNumber: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    seat: {
        select: {
            id: true,
            seatNumber: true,
            price: true,
            row: true,
            column: true,
            category: true,
            status: true,
            busId: true,
            bus: {
                select: {
                    id: true,
                    licensePlate: true,
                    capacity: true,
                    category: true,
                    createdAt: true,
                    updatedAt: true,
                    passengers: {
                        select: {
                            id: true,
                            userId: true,
                            busId: true,
                            createdAt: true,
                            updatedAt: true,
                            user: {
                                select: {
                                    id: true,
                                    clerkId: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    image: true,
                                    role: true,
                                    createdAt: true,
                                    updatedAt: true,
                                },
                            },
                        },
                    },
                    images: { select: { id: true, src: true, blurDataURL: true, alt: true, busId: true } },
                },
            },
        },
    },
    trip: {
        select: {
            id: true,
            busId: true,
            routeId: true,
            destinationIndex: true,
            departureTime: true,
            status: true,
            isFullyBooked: true,
            driverId: true,
        },
        include: {
            bus: {
                select: {
                    id: true,
                    licensePlate: true,
                    capacity: true,
                    category: true,
                    images: { select: { id: true, src: true, blurDataURL: true, alt: true, busId: true } },
                },
            },
        },
    },
    payments: {
        select: {
            id: true,
            reservationId: true,
            userId: true,
            amount: true,
            status: true,
            mPesaReceiptNumber: true,
            phoneNumber: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: {
                    id: true,
                    clerkId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    image: true,
                    role: true,
                    phoneNumber: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            reservation: {
                select: {
                    id: true,
                    userId: true,
                    tripId: true,
                    seatId: true,
                    status: true,
                    bookedAt: true,
                    updatedAt: true,
                    successfulPaymentId: true,
                },
            },
        },
    },
};

// Custom Error
class ReservationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReservationError';
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
    throw new ReservationError(`Failed to ${context}: ${errorMsg}`);
}

function mapImage(img: any): Image {
    return { id: img.id, src: img.src, blurDataURL: img.blurDataURL ?? undefined, alt: img.alt, busId: img.busId };
}

function mapUser(user: any): User {
    return {
        id: user.id,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        role: user.role as Role,
        phoneNumber: user.phoneNumber ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function mapBus(bus: any): Bus {
    return {
        id: bus.id,
        licensePlate: bus.licensePlate,
        capacity: bus.capacity,
        category: bus.category as MatatuCapacity,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
        images: bus.images?.map(mapImage) ?? [],
        passengers: bus.passengers?.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            busId: p.busId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            user: mapUser(p.user),
        })),
    };
}

function mapSeat(seat: any): Seat {
    return {
        id: seat.id,
        busId: seat.busId,
        seatNumber: Number(seat.seatNumber),
        price: seat.price,
        row: seat.row,
        column: seat.column,
        category: seat.category,
        status: seat.status,
        bus: mapBus(seat.bus),
    };
}

function mapTrip(trip: any): Trip {
    return {
        id: trip.id,
        busId: trip.busId,
        routeId: trip.routeId,
        destinationIndex: trip.destinationIndex,
        departureTime: trip.departureTime,
        status: trip.status,
        isFullyBooked: trip.isFullyBooked,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        driverId: trip.driverId ?? undefined,
        bus: mapBus(trip.bus),
    };
}

function mapPayment(payment: any): Payment {
    return {
        id: payment.id,
        reservationId: payment.reservationId,
        userId: payment.userId,
        amount: payment.amount,
        status: payment.status,
        mPesaReceiptNumber: payment.mPesaReceiptNumber ?? undefined,
        phoneNumber: payment.phoneNumber ?? null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        user: mapUser(payment.user),
        reservation: {
            id: payment.reservation.id,
            userId: payment.reservation.userId,
            tripId: payment.reservation.tripId,
            seatId: payment.reservation.seatId,
            status: payment.reservation.status,
            bookedAt: payment.reservation.bookedAt,
            updatedAt: payment.reservation.updatedAt,
            successfulPaymentId: payment.reservation.successfulPaymentId ?? undefined,
            user: mapUser(payment.reservation.user),
            seat: mapSeat(payment.reservation.seat),
            trip: mapTrip(payment.reservation.trip),
            payments: [],
            messages: [],
        },
    };
}

function formatReservation(reservation: ReservationWithRelations): Reservation {
    return {
        id: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        status: reservation.status,
        bookedAt: reservation.bookedAt,
        updatedAt: reservation.updatedAt,
        successfulPaymentId: reservation.successfulPaymentId ?? undefined,
        user: mapUser(reservation.user),
        seat: mapSeat(reservation.seat),
        trip: mapTrip(reservation.trip),
        payments: reservation.payments.map(mapPayment),
        messages: [],
    };
}

// Create Reservation with Payment
export async function createReservation({
    userId,
    tripId,
    seatId,
    clerkId,
    phoneNumber,
}: {
    userId: string;
    tripId: string;
    seatId: string;
    clerkId: string;
    phoneNumber: string;
}): Promise<Reservation> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = schemas.reservation.parse({ userId, tripId, seatId, clerkId, phoneNumber });

            const user = await tx.user.findFirst({
                where: { phoneNumber: validatedData.phoneNumber },
                select: { id: true },
            });
            if (!user) throw new ReservationError('No user found with the provided phone number');
            if (user.id !== validatedData.userId) throw new ReservationError('Phone number does not match user');

            const seatData = await selectSeatForReservation({
                seatId: validatedData.seatId,
                tripId: validatedData.tripId,
                clerkId: validatedData.clerkId,
            });

            const seat = await tx.seat.findUnique({ where: { id: validatedData.seatId }, select: { price: true } });
            if (!seat) throw new ReservationError('Seat not found');

            await tx.payment.create({
                data: {
                    reservationId: seatData.reservation!.id,
                    userId: user.id,
                    amount: seat.price,
                    phoneNumber: validatedData.phoneNumber,
                    status: PaymentStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            const reservation = await tx.reservation.findUnique({
                where: { id: seatData.reservation!.id },
                include: reservationInclude,
            });
            if (!reservation) throw new ReservationError('Failed to fetch created reservation');

            return formatReservation(reservation);
        } catch (error) {
            handleError(error, 'createReservation');
        }
    });
}

// Read Reservations (Passenger)
export async function getPassengerReservations({ clerkId }: { clerkId: string }): Promise<Reservation[]> {
    try {
        const validatedData = schemas.passengerReservations.parse({ clerkId });

        const user = await db.user.findUnique({ where: { clerkId: validatedData.clerkId }, select: { id: true } });
        if (!user) throw new ReservationError('User not found');

        const reservations = await db.reservation.findMany({ where: { userId: user.id }, include: reservationInclude });
        return reservations.map(formatReservation);
    } catch (error) {
        handleError(error, 'getPassengerReservations');
    }
}

// Read Available Trips
export async function getAvailableTrips({
    pickup,
    destination,
}: {
    pickup?: string;
    destination?: string;
}): Promise<Trip[]> {
    try {
        const validatedData = schemas.tripSearch.parse({ pickup, destination });

        const where: Prisma.TripWhereInput = {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
            departureTime: { gte: new Date() },
        };

        if (validatedData.pickup || validatedData.destination) {
            where.route = {
                OR: [
                    validatedData.pickup
                        ? {
                              pickup_point: {
                                  path: ['pickup_point'],
                                  string_contains: validatedData.pickup,
                                  mode: 'insensitive',
                              },
                          }
                        : {},
                    validatedData.destination
                        ? { destinations: { has: { destination: validatedData.destination } } }
                        : {},
                ],
            };
        }

        const trips = await db.trip.findMany({
            where,
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        images: { select: { id: true, src: true, blurDataURL: true, alt: true, busId: true } },
                    },
                },
                route: {
                    select: { id: true, route_number: true, pickup_point: true, destinations: true, helix: true },
                },
            },
        });

        return trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            routeId: trip.routeId,
            destinationIndex: trip.destinationIndex,
            departureTime: trip.departureTime,
            status: trip.status,
            isFullyBooked: trip.isFullyBooked,
            createdAt: trip.createdAt,
            updatedAt: trip.updatedAt,
            driverId: trip.driverId ?? undefined,
            bus: mapBus(trip.bus),
            route: {
                id: trip.route.id,
                route_number: trip.route.route_number,
                pickup_point: trip.route.pickup_point as any,
                destinations: trip.route.destinations as any[],
                helix: trip.route.helix,
                createdAt: trip.createdAt,
                updatedAt: trip.updatedAt,
            },
        }));
    } catch (error) {
        handleError(error, 'getAvailableTrips');
    }
}

// Update Reservation (Confirm)
export async function confirmReservation(reservationId: string): Promise<Reservation> {
    try {
        const reservation = await db.reservation.findUnique({
            where: { id: reservationId },
            include: reservationInclude,
        });
        if (!reservation) throw new ReservationError('Reservation not found');
        if (reservation.status !== ReservationStatus.PENDING) throw new ReservationError('Reservation is not pending');

        const updatedReservation = await db.reservation.update({
            where: { id: reservationId },
            data: { status: ReservationStatus.CONFIRMED, updatedAt: new Date() },
            include: reservationInclude,
        });

        await updateSeat(updatedReservation.seatId, { status: SeatStatus.RESERVED }, reservation.user.clerkId);
        return formatReservation(updatedReservation);
    } catch (error) {
        handleError(error, 'confirmReservation');
    }
}

// Update Reservation (Cancel)
export async function cancelReservation(reservationId: string, clerkId: string): Promise<Reservation> {
    try {
        const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } });
        if (!user) throw new ReservationError('User not found');

        const reservation = await db.reservation.findUnique({
            where: { id: reservationId },
            include: reservationInclude,
        });
        if (!reservation) throw new ReservationError('Reservation not found');
        if (reservation.userId !== user.id) throw new ReservationError('Unauthorized to cancel this reservation');
        if (reservation.status === ReservationStatus.CANCELLED)
            throw new ReservationError('Reservation already cancelled');

        const updatedReservation = await db.reservation.update({
            where: { id: reservationId },
            data: { status: ReservationStatus.CANCELLED, successfulPaymentId: null, updatedAt: new Date() },
            include: reservationInclude,
        });

        await updateSeat(updatedReservation.seatId, { status: SeatStatus.AVAILABLE }, clerkId);
        return formatReservation(updatedReservation);
    } catch (error) {
        handleError(error, 'cancelReservation');
    }
}

// Complete Trip Reservations
export async function completeTripReservations({
    tripId,
    clerkId,
}: {
    tripId: string;
    clerkId: string;
}): Promise<Reservation[]> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = schemas.completeTrip.parse({ tripId, clerkId });

            const user = await tx.user.findUnique({
                where: { clerkId: validatedData.clerkId },
                select: { id: true, role: true, driver: { select: { id: true } } },
            });
            if (!user || (user.role !== ROLES.DRIVER && user.role !== ROLES.ORGANIZATION)) {
                throw new ReservationError('User is not authorized to complete trip reservations');
            }

            const trip = await tx.trip.findUnique({
                where: { id: validatedData.tripId },
                select: { driverId: true, status: true },
            });
            if (!trip) throw new ReservationError(`Trip with ID ${validatedData.tripId} not found`);
            if (user.role === ROLES.DRIVER && user.driver?.id !== trip.driverId) {
                throw new ReservationError('User is not authorized for this trip');
            }
            if (trip.status !== 'IN_PROGRESS') {
                throw new ReservationError('Trip is not in progress');
            }

            const reservations = await tx.reservation.findMany({
                where: { tripId: validatedData.tripId, status: ReservationStatus.CONFIRMED },
                include: reservationInclude,
            });

            if (reservations.length === 0) return [];

            await tx.reservation.updateMany({
                where: { tripId: validatedData.tripId, status: ReservationStatus.CONFIRMED },
                data: { status: ReservationStatus.COMPLETED, updatedAt: new Date() },
            });

            for (const reservation of reservations) {
                await updateSeat(reservation.seatId, { status: SeatStatus.AVAILABLE }, validatedData.clerkId);
            }

            const updatedReservations = await tx.reservation.findMany({
                where: { tripId: validatedData.tripId, status: ReservationStatus.COMPLETED },
                include: reservationInclude,
            });

            return updatedReservations.map(formatReservation);
        } catch (error) {
            handleError(error, 'completeTripReservations');
        }
    });
}
