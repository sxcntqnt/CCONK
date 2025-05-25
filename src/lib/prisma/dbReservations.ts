'use server';

import { db } from '@/lib/prisma';
import { Prisma, ReservationStatus, PaymentStatus, SeatStatus } from '@prisma/client';
import { User, Bus, Seat, Reservation, Image, Trip, Route, Payment, Message, Passenger } from '@/utils/constants/types';
import { selectSeatForReservation, updateSeat } from './dbSeats';
import { z } from 'zod';
import { parseISO, isValid } from 'date-fns';
import { ReservationWithRelations } from './dbTypes';
import { ROLES } from '@/utils/constants/roles';

// Validation Schemas
const reservationSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    tripId: z.string().min(1, 'Trip ID is required'),
    seatId: z.string().min(1, 'Seat ID is required'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
});

const passengerReservationsSchema = z.object({
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

const tripSearchSchema = z.object({
    pickup: z.string().min(1, 'Pickup is required').optional(),
    destination: z.string().min(1, 'Destination is required').optional(),
});

const completeTripSchema = z.object({
    tripId: z.string().min(1, 'Trip ID is required'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

// Custom Error
class ReservationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReservationError';
    }
}

// Format Reservation for Response
function formatReservation(reservation: ReservationWithRelations): Reservation & { user: User; seat: Seat } {
    return {
        id: reservation.id,
        userId: reservation.userId,
        tripId: reservation.tripId,
        seatId: reservation.seatId,
        status: reservation.status,
        bookedAt: reservation.bookedAt,
        updatedAt: reservation.updatedAt,
        successfulPaymentId: reservation.successfulPaymentId ?? undefined,
        trip: {
            id: reservation.trip.id,
            busId: reservation.trip.busId,
            routeId: reservation.trip.routeId,
            destinationIndex: reservation.trip.destinationIndex,
            departureTime: reservation.trip.departureTime,
            status: reservation.trip.status,
            isFullyBooked: reservation.trip.isFullyBooked,
            createdAt: new Date(), // Placeholder
            updatedAt: new Date(), // Placeholder
            driverId: reservation.trip.driverId ?? undefined,
            bus: {
                id: reservation.trip.bus.id,
                licensePlate: reservation.trip.bus.licensePlate,
                capacity: reservation.trip.bus.capacity,
                category: reservation.trip.bus.category,
                images: reservation.trip.bus.images.map((img) => ({
                    id: img.id,
                    src: img.src,
                    blurDataURL: img.blurDataURL ?? undefined,
                    alt: img.alt,
                    busId: img.busId,
                })),
            },
        },
        seat: {
            id: reservation.seat.id,
            busId: reservation.seat.busId,
            seatNumber: reservation.seat.seatNumber,
            price: reservation.seat.price,
            row: reservation.seat.row,
            column: reservation.seat.column,
            category: reservation.seat.category,
            status: reservation.seat.status,
            bus: {
                id: reservation.seat.bus.id,
                licensePlate: reservation.seat.bus.licensePlate,
                capacity: reservation.seat.bus.capacity,
                category: reservation.seat.bus.category,
                createdAt: reservation.seat.bus.createdAt,
                updatedAt: reservation.seat.bus.updatedAt,
                passengers: reservation.seat.bus.passengers.map((p) => ({
                    id: p.id,
                    userId: p.userId,
                    busId: p.busId, // string | null
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    user: {
                        id: p.user.id,
                        clerkId: p.user.clerkId,
                        name: p.user.name,
                        email: p.user.email,
                        image: p.user.image,
                        role: p.user.role,
                        createdAt: p.user.createdAt,
                        updatedAt: p.user.updatedAt,
                    },
                })),
                images: reservation.seat.bus.images.map((img) => ({
                    id: img.id,
                    src: img.src,
                    blurDataURL: img.blurDataURL ?? undefined,
                    alt: img.alt,
                    busId: img.busId,
                })),
            },
        },
        user: {
            id: reservation.user.id,
            clerkId: reservation.user.clerkId,
            name: reservation.user.name,
            email: reservation.user.email,
            image: reservation.user.image,
            role: reservation.user.role,
            phoneNumber: reservation.user.phoneNumber ?? undefined,
            createdAt: reservation.user.createdAt,
            updatedAt: reservation.user.updatedAt,
        },
        payments: reservation.payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            mPesaReceiptNumber: payment.mPesaReceiptNumber ?? undefined, // Explicit coercion
            phoneNumber: payment.phoneNumber,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        })),
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
}): Promise<Reservation & { user: User; seat: Seat }> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = reservationSchema.parse({ userId, tripId, seatId, clerkId, phoneNumber });

            // Verify user exists with the provided phoneNumber
            const user = await tx.user.findFirst({
                where: { phoneNumber: validatedData.phoneNumber },
                select: { id: true },
            });
            if (!user) throw new ReservationError('No user found with the provided phone number');
            if (user.id !== validatedData.userId) throw new ReservationError('Phone number does not match user');

            // Use selectSeatForReservation to handle seat selection and reservation creation
            const seatData = await selectSeatForReservation({
                seatId: validatedData.seatId,
                tripId: validatedData.tripId,
                clerkId: validatedData.clerkId,
            });

            // Fetch seat price for payment
            const seat = await tx.seat.findUnique({
                where: { id: validatedData.seatId },
                select: { price: true },
            });
            if (!seat) throw new ReservationError('Seat not found');

            // Create payment using phoneNumber-verified userId
            const payment = await tx.payment.create({
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

            // Fetch the full reservation with relations for response
            const reservation = await tx.reservation.findUnique({
                where: { id: seatData.reservation!.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            clerkId: true,
                            name: true,
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
                                                    name: true,
                                                    email: true,
                                                    image: true,
                                                    role: true,
                                                    createdAt: true,
                                                    updatedAt: true,
                                                },
                                            },
                                        },
                                    },
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    name: true,
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
                },
            });

            if (!reservation) throw new ReservationError('Failed to fetch created reservation');

            return formatReservation(reservation);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`createReservation error: ${errorMsg}`);
            throw new ReservationError(`Failed to create reservation: ${errorMsg}`);
        }
    });
}

// Read Reservations (Passenger)
export async function getPassengerReservations({
    clerkId,
}: {
    clerkId: string;
}): Promise<(Reservation & { user: User; seat: Seat })[]> {
    try {
        const validatedData = passengerReservationsSchema.parse({ clerkId });

        const user = await db.user.findUnique({
            where: { clerkId: validatedData.clerkId },
            select: { id: true },
        });
        if (!user) throw new ReservationError('User not found');

        const reservations = await db.reservation.findMany({
            where: { userId: user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
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
                                                name: true,
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
                                name: true,
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
            },
        });

        return reservations.map(formatReservation);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getPassengerReservations error: ${errorMsg}`);
        throw new ReservationError(`Failed to fetch reservations: ${errorMsg}`);
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
        const validatedData = tripSearchSchema.parse({ pickup, destination });

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
                        ? {
                              destinations: {
                                  has: { destination: validatedData.destination },
                              },
                          }
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
                    select: {
                        id: true,
                        route_number: true,
                        pickup_point: true,
                        destinations: true,
                        helix: true,
                    },
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
            bus: {
                id: trip.bus.id,
                licensePlate: trip.bus.licensePlate,
                capacity: trip.bus.capacity,
                category: trip.bus.category,
                images: trip.bus.images.map((img) => ({
                    id: img.id,
                    src: img.src,
                    blurDataURL: img.blurDataURL ?? undefined,
                    alt: img.alt,
                    busId: img.busId,
                })),
            },
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
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getAvailableTrips error: ${errorMsg}`);
        throw new ReservationError(`Failed to fetch available trips: ${errorMsg}`);
    }
}

// Update Reservation (Confirm)
export async function confirmReservation(reservationId: string): Promise<Reservation & { user: User; seat: Seat }> {
    try {
        const reservation = await db.reservation.findUnique({
            where: { id: reservationId },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
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
                                                name: true,
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
                                name: true,
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
            },
        });

        if (!reservation) throw new ReservationError('Reservation not found');
        if (reservation.status !== ReservationStatus.PENDING) throw new ReservationError('Reservation is not pending');

        const updatedReservation = await db.reservation.update({
            where: { id: reservationId },
            data: {
                status: ReservationStatus.CONFIRMED,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
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
                                                name: true,
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
                                name: true,
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
            },
        });

        // Update seat status to RESERVED
        await updateSeat(updatedReservation.seatId, { status: SeatStatus.RESERVED }, updatedReservation.user.clerkId);

        return formatReservation(updatedReservation);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`confirmReservation error: ${errorMsg}`);
        throw new ReservationError(`Failed to confirm reservation: ${errorMsg}`);
    }
}

// Update Reservation (Cancel)
export async function cancelReservation(
    reservationId: string,
    clerkId: string,
): Promise<Reservation & { user: User; seat: Seat }> {
    try {
        const user = await db.user.findUnique({
            where: { clerkId },
            select: { id: true },
        });
        if (!user) throw new ReservationError('User not found');

        const reservation = await db.reservation.findUnique({
            where: { id: reservationId },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
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
                                                name: true,
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
                                name: true,
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
            },
        });

        if (!reservation) throw new ReservationError('Reservation not found');
        if (reservation.userId !== user.id) throw new ReservationError('Unauthorized to cancel this reservation');
        if (reservation.status === ReservationStatus.CANCELLED)
            throw new ReservationError('Reservation already cancelled');

        const updatedReservation = await db.reservation.update({
            where: { id: reservationId },
            data: {
                status: ReservationStatus.CANCELLED,
                successfulPaymentId: null,
                updatedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
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
                                                name: true,
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
                                name: true,
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
            },
        });

        // Update seat status to AVAILABLE
        await updateSeat(updatedReservation.seatId, { status: SeatStatus.AVAILABLE }, clerkId);

        return formatReservation(updatedReservation);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`cancelReservation error: ${errorMsg}`);
        throw new ReservationError(`Failed to cancel reservation: ${errorMsg}`);
    }
}

// Complete Trip Reservations
export async function completeTripReservations({
    tripId,
    clerkId,
}: {
    tripId: string;
    clerkId: string;
}): Promise<(Reservation & { user: User; seat: Seat })[]> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = completeTripSchema.parse({ tripId, clerkId });

            // Verify user authorization (driver or organization)
            const user = await tx.user.findUnique({
                where: { clerkId: validatedData.clerkId },
                select: {
                    id: true,
                    role: true,
                    driver: { select: { id: true } },
                },
            });
            if (!user || (user.role !== ROLES.DRIVER && user.role !== ROLES.ORGANIZATION)) {
                throw new ReservationError('User is not authorized to complete trip reservations');
            }

            // Fetch trip and verify driver ownership (if driver)
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

            // Find all CONFIRMED reservations for the trip
            const reservations = await tx.reservation.findMany({
                where: {
                    tripId: validatedData.tripId,
                    status: ReservationStatus.CONFIRMED,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            clerkId: true,
                            name: true,
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
                                                    name: true,
                                                    email: true,
                                                    image: true,
                                                    role: true,
                                                    createdAt: true,
                                                    updatedAt: true,
                                                },
                                            },
                                        },
                                    },
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    name: true,
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
                },
            });

            if (reservations.length === 0) {
                return [];
            }

            // Update reservations to COMPLETED
            await tx.reservation.updateMany({
                where: {
                    tripId: validatedData.tripId,
                    status: ReservationStatus.CONFIRMED,
                },
                data: {
                    status: ReservationStatus.COMPLETED,
                    updatedAt: new Date(),
                },
            });

            // Update seats to AVAILABLE using updateSeat
            for (const reservation of reservations) {
                await updateSeat(reservation.seatId, { status: SeatStatus.AVAILABLE }, validatedData.clerkId);
            }

            // Fetch updated reservations
            const updatedReservations = await tx.reservation.findMany({
                where: {
                    tripId: validatedData.tripId,
                    status: ReservationStatus.COMPLETED,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            clerkId: true,
                            name: true,
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
                                                    name: true,
                                                    email: true,
                                                    image: true,
                                                    role: true,
                                                    createdAt: true,
                                                    updatedAt: true,
                                                },
                                            },
                                        },
                                    },
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    images: {
                                        select: { id: true, src: true, blurDataURL: true, alt: true, busId: true },
                                    },
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
                                    name: true,
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
                },
            });

            return updatedReservations.map(formatReservation);
        } catch (error) {
            const errorMsg =
                error instanceof z.ZodError
                    ? error.errors.map((e) => e.message).join(', ')
                    : error instanceof Error
                      ? error.message
                      : String(error);
            console.error(`completeTripReservations error: ${errorMsg}`);
            throw new ReservationError(`Failed to complete trip reservations: ${errorMsg}`);
        }
    });
}
