import { db } from '@/lib/prisma';
import { Driver, Bus, Trip, Reservation, User, ApiResponse, DriverData, DriverStatus, TripStatus } from '@/utils';

export const getDriverById = async (driverId: number): Promise<ApiResponse<Driver>> => {
    try {
        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
                user: { select: { name: true, email: true, image: true } },
            },
        });

        if (!driver) {
            return { error: 'Driver not found', status: 404 };
        }

        const formattedDriver: Driver = {
            id: driver.id,
            userId: driver.userId,
            licenseNumber: driver.licenseNumber,
            status: driver.status,
            firstName: driver.user.name.split(' ')[0],
            lastName: driver.user.name.split(' ')[1] || '',
            email: driver.user.email,
            profileImageUrl: driver.user.image || '',
            rating: driver.rating || undefined,
            busId: driver.busId || undefined,
        };

        return { data: formattedDriver, status: 200 };
    } catch (error) {
        console.error('Error fetching driver:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const getBusByDriverId = async (driverId: number): Promise<ApiResponse<Bus>> => {
    try {
        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: {
                bus: {
                    include: { images: { select: { src: true, alt: true } } },
                },
            },
        });

        if (!driver?.bus) {
            return { error: 'Bus not found for driver', status: 404 };
        }

        const formattedBus: Bus = {
            id: driver.bus.id,
            licensePlate: driver.bus.licensePlate,
            capacity: driver.bus.capacity,
            model: driver.bus.model || undefined,
            latitude: driver.bus.latitude || undefined,
            longitude: driver.bus.longitude || undefined,
            lastLocationUpdate: driver.bus.lastLocationUpdate?.toISOString(),
            category: driver.bus.category,
            images: driver.bus.images,
        };

        return { data: formattedBus, status: 200 };
    } catch (error) {
        console.error('Error fetching bus:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
export const getActiveTripsForDriver = async (driverId: number): Promise<ApiResponse<Trip[]>> => {
    try {
        const trips = await db.trip.findMany({
            where: {
                driverId,
                status: 'IN_PROGRESS',
            },
            select: {
                id: true,
                busId: true,
                driverId: true,
                departureCity: true,
                arrivalCity: true,
                departureTime: true,
                arrivalTime: true,
                status: true,
                isFullyBooked: true,
                originLatitude: true,
                originLongitude: true,
                destinationLatitude: true,
                destinationLongitude: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const formattedTrips: Trip[] = trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            driverId: trip.driverId || undefined,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
            status: trip.status.toLowerCase() as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
            isFullyBooked: trip.isFullyBooked,
            originLatitude: trip.originLatitude || undefined,
            originLongitude: trip.originLongitude || undefined,
            destinationLatitude: trip.destinationLatitude || undefined,
            destinationLongitude: trip.destinationLongitude || undefined,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
        }));

        return { data: formattedTrips, status: 200 };
    } catch (error) {
        console.error('Error fetching active trips:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const createTripReservation = async (
    userId: number,
    tripId: number,
    seatId: number,
): Promise<ApiResponse<Reservation>> => {
    try {
        const trip = await db.trip.findUnique({
            where: { id: tripId },
            select: { isFullyBooked: true, status: true, busId: true },
        });

        if (!trip) {
            return { error: 'Trip not found', status: 404 };
        }

        if (trip.isFullyBooked) {
            return { error: 'Trip is fully booked', status: 400 };
        }

        if (trip.status !== 'IN_PROGRESS' && trip.status !== 'SCHEDULED') {
            return { error: 'Trip is not active', status: 400 };
        }

        const seat = await db.seat.findUnique({
            where: { id: seatId },
            select: { status: true, busId: true },
        });

        if (!seat) {
            return { error: 'Seat not found', status: 404 };
        }

        if (seat.status !== 'available') {
            return { error: 'Seat is not available', status: 400 };
        }

        if (seat.busId !== trip.busId) {
            return { error: "Seat does not belong to the trip's bus", status: 400 };
        }

        const existingReservation = await db.reservation.findFirst({
            where: { tripId, seatId },
        });

        if (existingReservation) {
            return { error: 'Seat is already reserved for this trip', status: 400 };
        }

        const reservation = await db.reservation.create({
            data: {
                userId,
                tripId,
                seatId,
                status: 'CONFIRMED',
                bookedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        await db.seat.update({
            where: { id: seatId },
            data: { status: 'booked' },
        });

        const availableSeats = await db.seat.count({
            where: { busId: trip.busId, status: 'available' },
        });

        if (availableSeats === 0) {
            await db.trip.update({
                where: { id: tripId },
                data: { isFullyBooked: true },
            });
        }

        const formattedReservation: Reservation = {
            id: reservation.id,
            userId: reservation.userId,
            tripId: reservation.tripId,
            seatId: reservation.seatId,
            status: reservation.status.toLowerCase() as 'pending' | 'confirmed' | 'cancelled',
            bookedAt: reservation.bookedAt.toISOString(),
            updatedAt: reservation.updatedAt.toISOString(),
            paymentId: reservation.paymentId || undefined,
        };

        return { data: formattedReservation, status: 201 };
    } catch (error) {
        console.error('Error creating reservation:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const getTripIdForDriver = async (driverId: number): Promise<ApiResponse<number>> => {
    try {
        const trip = await db.trip.findFirst({
            where: {
                driverId,
                status: 'IN_PROGRESS',
            },
            select: { id: true },
        });

        if (!trip) {
            return { error: 'No active trip found for driver', status: 404 };
        }

        return { data: trip.id, status: 200 };
    } catch (error) {
        console.error('Error fetching trip ID:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const updateTripStatus = async (tripId: number, status: TripStatus): Promise<ApiResponse<Trip>> => {
    try {
        const trip = await db.trip.findUnique({
            where: { id: tripId },
        });

        if (!trip) {
            return { error: 'Trip not found', status: 404 };
        }

        const updatedTrip = await db.trip.update({
            where: { id: tripId },
            data: { status },
            select: {
                id: true,
                busId: true,
                driverId: true,
                departureCity: true,
                arrivalCity: true,
                departureTime: true,
                arrivalTime: true,
                status: true,
                isFullyBooked: true,
                originLatitude: true,
                originLongitude: true,
                destinationLatitude: true,
                destinationLongitude: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const formattedTrip: Trip = {
            id: updatedTrip.id,
            busId: updatedTrip.busId,
            driverId: updatedTrip.driverId || undefined,
            departureCity: updatedTrip.departureCity,
            arrivalCity: updatedTrip.arrivalCity,
            departureTime: updatedTrip.departureTime.toISOString(),
            arrivalTime: updatedTrip.arrivalTime?.toISOString(),
            status: updatedTrip.status.toLowerCase() as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
            isFullyBooked: updatedTrip.isFullyBooked,
            originLatitude: updatedTrip.originLatitude || undefined,
            originLongitude: updatedTrip.originLongitude || undefined,
            destinationLatitude: updatedTrip.destinationLatitude || undefined,
            destinationLongitude: updatedTrip.destinationLongitude || undefined,
            createdAt: updatedTrip.createdAt.toISOString(),
            updatedAt: updatedTrip.updatedAt.toISOString(),
        };

        return { data: formattedTrip, status: 200 };
    } catch (error) {
        console.error('Error updating trip status:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const getUsersWithReservations = async (tripId: number): Promise<ApiResponse<User[]>> => {
    try {
        const reservations = await db.reservation.findMany({
            where: { tripId },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
                        email: true,
                        image: true,
                        phoneNumber: true,
                        role: true,
                    },
                },
            },
        });

        const users: User[] = reservations.map((reservation) => ({
            id: reservation.user.id,
            clerkId: reservation.user.clerkId,
            name: reservation.user.name,
            email: reservation.user.email,
            image: reservation.user.image,
            phoneNumber: reservation.user.phoneNumber || undefined,
            role: reservation.user.role,
        }));

        return { data: users, status: 200 };
    } catch (error) {
        console.error('Error fetching users with reservations:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const getDriverData = async (clerkId: string): Promise<ApiResponse<DriverData>> => {
    try {
        const driverRecord = await db.user.findUnique({
            where: { clerkId },
            include: {
                driver: {
                    include: {
                        trips: {
                            where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] }, arrivalTime: null },
                            include: { bus: { include: { images: { select: { src: true, alt: true } } } } },
                            orderBy: { departureTime: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!driverRecord || driverRecord.role !== 'DRIVER' || !driverRecord.driver) {
            return { error: 'User is not a driver or has no driver profile', status: 404 };
        }

        const driver: Driver = {
            id: driverRecord.driver.id,
            busId: driverRecord.driver.busId || undefined,
            userId: driverRecord.driver.userId,
            licenseNumber: driverRecord.driver.licenseNumber,
            status: driverRecord.driver.status,
            firstName: driverRecord.name.split(' ')[0],
            lastName: driverRecord.name.split(' ')[1] || '',
            email: driverRecord.email,
            profileImageUrl: driverRecord.image || '',
            rating: driverRecord.driver.rating || undefined,
        };

        let trip: Trip | null = null;
        if (driverRecord.driver.trips[0]) {
            const tripRecord = driverRecord.driver.trips[0];
            trip = {
                id: tripRecord.id,
                busId: tripRecord.busId,
                driverId: tripRecord.driverId || undefined,
                departureCity: tripRecord.departureCity,
                arrivalCity: tripRecord.arrivalCity,
                departureTime: tripRecord.departureTime.toISOString(),
                arrivalTime: tripRecord.arrivalTime?.toISOString(),
                status: tripRecord.status.toLowerCase() as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                isFullyBooked: tripRecord.isFullyBooked,
                originLatitude: tripRecord.originLatitude || undefined,
                originLongitude: tripRecord.originLongitude || undefined,
                destinationLatitude: tripRecord.destinationLatitude || undefined,
                destinationLongitude: tripRecord.destinationLongitude || undefined,
                createdAt: tripRecord.createdAt.toISOString(),
                updatedAt: tripRecord.updatedAt.toISOString(),
                bus: tripRecord.bus
                    ? {
                          id: tripRecord.bus.id,
                          licensePlate: tripRecord.bus.licensePlate,
                          capacity: tripRecord.bus.capacity,
                          model: tripRecord.bus.model || undefined,
                          latitude: tripRecord.bus.latitude || undefined,
                          longitude: tripRecord.bus.longitude || undefined,
                          lastLocationUpdate: tripRecord.bus.lastLocationUpdate?.toISOString(),
                          category: tripRecord.bus.category,
                          images: tripRecord.bus.images,
                      }
                    : undefined,
            };
        }

        return { data: { driver, trip }, status: 200 };
    } catch (error) {
        console.error('Error fetching driver data:', error);
        return { error: 'Internal server error', status: 500 };
    }
};

export const getReservationCount = async (tripId: number): Promise<ApiResponse<number>> => {
    try {
        const count = await db.reservation.count({
            where: { tripId, status: 'CONFIRMED' },
        });
        return { data: count, status: 200 };
    } catch (error) {
        console.error('Error fetching reservation count:', error);
        return { error: 'Failed to fetch reservation count', status: 500 };
    }
};
