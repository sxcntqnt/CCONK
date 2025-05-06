"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleArrival = exports.getReservationCount = exports.getDriverData = exports.getUsersWithReservations = exports.updateTripStatus = exports.getTripIdForDriver = exports.createTripReservation = exports.getActiveTripsForDriver = exports.getDriverAndBusMarkerData = exports.getBusByDriverId = exports.getDriverById = void 0;
const prisma_1 = require("@/lib/prisma");
const store_1 = require("@/store");
const notify_driver_arrival_1 = require("@/actions/notify-driver-arrival");
const roles_1 = require("@/utils/constants/roles");
const getDriverById = async (driverId) => {
    try {
        const driver = await prisma_1.db.driver.findUnique({
            where: { id: driverId },
            include: {
                user: { select: { name: true, email: true, image: true } },
            },
        });
        if (!driver) {
            return { error: 'Driver not found', status: 404 };
        }
        const formattedDriver = {
            id: driver.id,
            userId: driver.userId,
            licenseNumber: driver.licenseNumber,
            status: driver.status, // No .toLowerCase(), matches 'ACTIVE' | 'OFFLINE'
            firstName: driver.user.name.split(' ')[0],
            lastName: driver.user.name.split(' ')[1] || '',
            email: driver.user.email,
            profileImageUrl: driver.user.image || '',
            rating: driver.rating || undefined,
            busId: driver.busId || undefined,
        };
        return { data: formattedDriver, status: 200 };
    }
    catch (error) {
        console.error('Error fetching driver:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getDriverById = getDriverById;
const getBusByDriverId = async (driverId) => {
    try {
        const driver = await prisma_1.db.driver.findUnique({
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
        const formattedBus = {
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
    }
    catch (error) {
        console.error('Error fetching bus:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getBusByDriverId = getBusByDriverId;
const getDriverAndBusMarkerData = async (driverId) => {
    try {
        const driverResponse = await (0, exports.getDriverById)(driverId);
        const busResponse = await (0, exports.getBusByDriverId)(driverId);
        if (driverResponse.error || busResponse.error) {
            return { error: driverResponse.error || busResponse.error, status: 404 };
        }
        const markerData = (0, store_1.mapDriverAndBusToMarkerData)(driverResponse.data, busResponse.data);
        return { data: markerData, status: 200 };
    }
    catch (error) {
        console.error('Error fetching marker data:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getDriverAndBusMarkerData = getDriverAndBusMarkerData;
const getActiveTripsForDriver = async (driverId) => {
    try {
        const trips = await prisma_1.db.trip.findMany({
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
        const formattedTrips = trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            driverId: trip.driverId || undefined,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
            status: trip.status.toLowerCase(),
            isFullyBooked: trip.isFullyBooked,
            originLatitude: trip.originLatitude || undefined,
            originLongitude: trip.originLongitude || undefined,
            destinationLatitude: trip.destinationLatitude || undefined,
            destinationLongitude: trip.destinationLongitude || undefined,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
        }));
        return { data: formattedTrips, status: 200 };
    }
    catch (error) {
        console.error('Error fetching active trips:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getActiveTripsForDriver = getActiveTripsForDriver;
const createTripReservation = async (userId, tripId, seatId) => {
    try {
        const trip = await prisma_1.db.trip.findUnique({
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
        const seat = await prisma_1.db.seat.findUnique({
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
        const existingReservation = await prisma_1.db.reservation.findFirst({
            where: { tripId, seatId },
        });
        if (existingReservation) {
            return { error: 'Seat is already reserved for this trip', status: 400 };
        }
        const reservation = await prisma_1.db.reservation.create({
            data: {
                userId,
                tripId,
                seatId,
                status: 'CONFIRMED',
                bookedAt: new Date(),
                updatedAt: new Date(),
            },
        });
        await prisma_1.db.seat.update({
            where: { id: seatId },
            data: { status: 'booked' },
        });
        const availableSeats = await prisma_1.db.seat.count({
            where: { busId: trip.busId, status: 'available' },
        });
        if (availableSeats === 0) {
            await prisma_1.db.trip.update({
                where: { id: tripId },
                data: { isFullyBooked: true },
            });
        }
        const formattedReservation = {
            id: reservation.id,
            userId: reservation.userId,
            tripId: reservation.tripId,
            seatId: reservation.seatId,
            status: reservation.status.toLowerCase(),
            bookedAt: reservation.bookedAt.toISOString(),
            updatedAt: reservation.updatedAt.toISOString(),
            paymentId: reservation.paymentId || undefined,
        };
        return { data: formattedReservation, status: 201 };
    }
    catch (error) {
        console.error('Error creating reservation:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.createTripReservation = createTripReservation;
const getTripIdForDriver = async (driverId) => {
    try {
        const trip = await prisma_1.db.trip.findFirst({
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
    }
    catch (error) {
        console.error('Error fetching trip ID:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getTripIdForDriver = getTripIdForDriver;
const updateTripStatus = async (tripId, status) => {
    try {
        const trip = await prisma_1.db.trip.findUnique({
            where: { id: tripId },
        });
        if (!trip) {
            return { error: 'Trip not found', status: 404 };
        }
        const updatedTrip = await prisma_1.db.trip.update({
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
        const formattedTrip = {
            id: updatedTrip.id,
            busId: updatedTrip.busId,
            driverId: updatedTrip.driverId || undefined,
            departureCity: updatedTrip.departureCity,
            arrivalCity: updatedTrip.arrivalCity,
            departureTime: updatedTrip.departureTime.toISOString(),
            arrivalTime: updatedTrip.arrivalTime?.toISOString(),
            status: updatedTrip.status.toLowerCase(),
            isFullyBooked: updatedTrip.isFullyBooked,
            originLatitude: updatedTrip.originLatitude || undefined,
            originLongitude: updatedTrip.originLongitude || undefined,
            destinationLatitude: updatedTrip.destinationLatitude || undefined,
            destinationLongitude: updatedTrip.destinationLongitude || undefined,
            createdAt: updatedTrip.createdAt.toISOString(),
            updatedAt: updatedTrip.updatedAt.toISOString(),
        };
        return { data: formattedTrip, status: 200 };
    }
    catch (error) {
        console.error('Error updating trip status:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.updateTripStatus = updateTripStatus;
const getUsersWithReservations = async (tripId) => {
    try {
        const reservations = await prisma_1.db.reservation.findMany({
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
        const users = reservations.map((reservation) => ({
            id: reservation.user.id,
            clerkId: reservation.user.clerkId,
            name: reservation.user.name,
            email: reservation.user.email,
            image: reservation.user.image,
            phoneNumber: reservation.user.phoneNumber || undefined,
            role: reservation.user.role,
        }));
        return { data: users, status: 200 };
    }
    catch (error) {
        console.error('Error fetching users with reservations:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getUsersWithReservations = getUsersWithReservations;
const getDriverData = async (clerkId) => {
    try {
        const driverRecord = await prisma_1.db.user.findUnique({
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
        if (!driverRecord || driverRecord.role !== roles_1.ROLES.DRIVER || !driverRecord.driver) {
            return { error: 'User is not a driver or has no driver profile', status: 404 };
        }
        const driver = {
            id: driverRecord.driver.id,
            busId: driverRecord.driver.busId || undefined,
            userId: driverRecord.driver.userId,
            licenseNumber: driverRecord.driver.licenseNumber,
            status: driverRecord.driver.status, // No .toLowerCase(), matches 'ACTIVE' | 'OFFLINE'
            firstName: driverRecord.name.split(' ')[0],
            lastName: driverRecord.name.split(' ')[1] || '',
            email: driverRecord.email,
            profileImageUrl: driverRecord.image || '',
            rating: driverRecord.driver.rating || undefined,
        };
        let trip = null;
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
                status: tripRecord.status.toLowerCase(),
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
    }
    catch (error) {
        console.error('Error fetching driver data:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.getDriverData = getDriverData;
const getReservationCount = async (tripId) => {
    try {
        const count = await prisma_1.db.reservation.count({
            where: { tripId, status: 'CONFIRMED' },
        });
        return { data: count, status: 200 };
    }
    catch (error) {
        console.error('Error fetching reservation count:', error);
        return { error: 'Failed to fetch reservation count', status: 500 };
    }
};
exports.getReservationCount = getReservationCount;
const handleArrival = async (tripId) => {
    try {
        const trip = await prisma_1.db.trip.findUnique({
            where: { id: tripId },
        });
        if (!trip) {
            return { error: 'Trip not found', status: 404 };
        }
        if (trip.status !== 'IN_PROGRESS' && trip.status !== 'SCHEDULED') {
            return { error: 'Trip is not active', status: 400 };
        }
        const updatedTrip = await prisma_1.db.trip.update({
            where: { id: tripId },
            data: {
                status: 'COMPLETED',
                arrivalTime: new Date(),
                updatedAt: new Date(),
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
        const formattedTrip = {
            id: updatedTrip.id,
            busId: updatedTrip.busId,
            driverId: updatedTrip.driverId || undefined,
            departureCity: updatedTrip.departureCity,
            arrivalCity: updatedTrip.arrivalCity,
            departureTime: updatedTrip.departureTime.toISOString(),
            arrivalTime: updatedTrip.arrivalTime?.toISOString(),
            status: updatedTrip.status.toLowerCase(),
            isFullyBooked: updatedTrip.isFullyBooked,
            originLatitude: updatedTrip.originLatitude || undefined,
            originLongitude: updatedTrip.originLongitude || undefined,
            destinationLatitude: updatedTrip.destinationLatitude || undefined,
            destinationLongitude: updatedTrip.destinationLongitude || undefined,
            createdAt: updatedTrip.createdAt.toISOString(),
            updatedAt: updatedTrip.updatedAt.toISOString(),
        };
        const formData = new FormData();
        formData.append('tripId', tripId.toString());
        await (0, notify_driver_arrival_1.notifyDriverArrival)(formData);
        return { data: formattedTrip, status: 200 };
    }
    catch (error) {
        console.error('Error handling arrival:', error);
        return { error: 'Internal server error', status: 500 };
    }
};
exports.handleArrival = handleArrival;
