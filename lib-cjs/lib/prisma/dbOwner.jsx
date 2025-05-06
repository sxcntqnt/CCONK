"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwner = getOwner;
exports.getBuses = getBuses;
exports.getDrivers = getDrivers;
exports.getTrips = getTrips;
exports.getReservations = getReservations;
exports.getNotifications = getNotifications;
exports.ensureBusHasTrip = ensureBusHasTrip;
const prisma_1 = require("@/lib/prisma");
// Fetch an owner by ID (for Dashboard)
async function getOwner(ownerId) {
    try {
        const owner = await prisma_1.db.owner.findUnique({
            where: { id: ownerId },
            include: {
                user: {
                    select: {
                        id: true,
                        clerkId: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                    },
                },
            },
        });
        if (!owner) {
            throw new Error('Owner not found');
        }
        return {
            id: owner.id,
            userId: owner.userId,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt,
            profileImageUrl: owner.user.image,
            user: {
                id: owner.user.id,
                clerkId: owner.user.clerkId,
                name: owner.user.name,
                email: owner.user.email,
                image: owner.user.image,
                role: owner.user.role,
            },
            buses: [],
            geofences: [],
            incomeExpenses: [],
            reports: [],
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOwner error: ${errorMsg}`);
        throw new Error(`Failed to fetch owner: ${errorMsg}`);
    }
}
// Fetch buses owned by the owner (for Vehicle)
async function getBuses({ ownerId, page = 1, pageSize = 10, filters = {}, }) {
    try {
        const { licensePlate, capacity } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        const buses = await prisma_1.db.bus.findMany({
            where: {
                ownerId,
                ...(licensePlate && { licensePlate }),
                ...(capacity && { capacity }),
            },
            include: {
                images: { select: { src: true, blurDataURL: true, alt: true } },
            },
            skip,
            take: pageSize,
            orderBy: { id: 'asc' },
        });
        const total = await prisma_1.db.bus.count({
            where: {
                ownerId,
                ...(licensePlate && { licensePlate }),
                ...(capacity && { capacity }),
            },
        });
        const formattedBuses = buses.map((bus) => ({
            id: bus.id,
            licensePlate: bus.licensePlate,
            capacity: bus.capacity,
            model: bus.model ?? undefined,
            latitude: bus.latitude ?? undefined,
            longitude: bus.longitude ?? undefined,
            lastLocationUpdate: bus.lastLocationUpdate?.toISOString(),
            category: bus.category,
            images: bus.images.length > 0
                ? bus.images.map((img) => ({
                    src: img.src,
                    blurDataURL: img.blurDataURL ?? undefined,
                    alt: img.alt,
                }))
                : [{ src: '/placeholder.jpg', blurDataURL: undefined, alt: 'Vehicle placeholder' }],
        }));
        return { buses: formattedBuses, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBuses error: ${errorMsg}`);
        throw new Error(`Failed to fetch buses: ${errorMsg}`);
    }
}
// Fetch drivers for the owner's buses (for Drivers)
async function getDrivers({ ownerId, page = 1, pageSize = 10, filters = {}, }) {
    try {
        const { licenseNumber } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        const drivers = await prisma_1.db.driver.findMany({
            where: {
                bus: { ownerId },
                ...(licenseNumber && { licenseNumber }),
            },
            select: {
                id: true,
                busId: true,
                userId: true,
                licenseNumber: true,
                status: true,
                rating: true,
                profileImageUrl: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            skip,
            take: pageSize,
            orderBy: { id: 'asc' },
        });
        const total = await prisma_1.db.driver.count({
            where: {
                bus: { ownerId },
                ...(licenseNumber && { licenseNumber }),
            },
        });
        const formattedDrivers = drivers.map((driver) => ({
            id: driver.id,
            busId: driver.busId ?? undefined,
            userId: driver.userId,
            licenseNumber: driver.licenseNumber,
            status: driver.status.toLowerCase(),
            firstName: driver.user.name.split(' ')[0],
            lastName: driver.user.name.split(' ')[1] || '',
            email: driver.user.email,
            profileImageUrl: driver.profileImageUrl,
            rating: driver.rating ?? undefined,
        }));
        return { drivers: formattedDrivers, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getDrivers error: ${errorMsg}`);
        throw new Error(`Failed to fetch drivers: ${errorMsg}`);
    }
}
// Fetch trips for the owner's buses (for Dashboard, Reservations)
async function getTrips({ ownerId, page = 1, pageSize = 10, filters = {}, }) {
    try {
        const { departureCity, arrivalCity, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        const statusMap = {
            scheduled: 'SCHEDULED',
            in_progress: 'IN_PROGRESS',
            completed: 'COMPLETED',
            cancelled: 'CANCELLED',
        };
        const prismaStatus = status ? statusMap[status.toLowerCase()] : undefined;
        if (status && !prismaStatus) {
            throw new Error(`Invalid trip status: ${status}`);
        }
        const trips = await prisma_1.db.trip.findMany({
            where: {
                bus: { ownerId },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
                ...(prismaStatus && { status: prismaStatus }),
            },
            include: {
                driver: {
                    include: { user: { select: { name: true, email: true } } },
                },
                bus: { select: { id: true, licensePlate: true, capacity: true, category: true } },
            },
            skip,
            take: pageSize,
            orderBy: { departureTime: 'asc' },
        });
        const total = await prisma_1.db.trip.count({
            where: {
                bus: { ownerId },
                ...(departureCity && { departureCity }),
                ...(arrivalCity && { arrivalCity }),
                ...(prismaStatus && { status: prismaStatus }),
            },
        });
        const formattedTrips = trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            driverId: trip.driverId ?? undefined,
            departureCity: trip.departureCity,
            arrivalCity: trip.arrivalCity,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
            status: trip.status.toLowerCase(),
            isFullyBooked: trip.isFullyBooked,
            originLatitude: trip.originLatitude ?? undefined,
            originLongitude: trip.originLongitude ?? undefined,
            destinationLatitude: trip.destinationLatitude ?? undefined,
            destinationLongitude: trip.destinationLongitude ?? undefined,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
            bus: {
                id: trip.bus.id,
                licensePlate: trip.bus.licensePlate,
                capacity: trip.bus.capacity,
                category: trip.bus.category,
                images: [],
            },
        }));
        return { trips: formattedTrips, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getTrips error: ${errorMsg}`);
        throw new Error(`Failed to fetch trips: ${errorMsg}`);
    }
}
// Fetch reservations for the owner's buses (for Reservations, Customer)
async function getReservations({ ownerId, page = 1, pageSize = 10, filters = {}, }) {
    try {
        const { tripId, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        const statusMap = {
            pending: 'PENDING',
            confirmed: 'CONFIRMED',
            cancelled: 'CANCELLED',
        };
        const prismaStatus = status ? statusMap[status.toLowerCase()] : undefined;
        if (status && !prismaStatus) {
            throw new Error(`Invalid reservation status: ${status}`);
        }
        const reservations = await prisma_1.db.reservation.findMany({
            where: {
                trip: { bus: { ownerId } },
                ...(tripId && { tripId }),
                ...(prismaStatus && { status: prismaStatus }),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            skip,
            take: pageSize,
            orderBy: { bookedAt: 'desc' },
        });
        const total = await prisma_1.db.reservation.count({
            where: {
                trip: { bus: { ownerId } },
                ...(tripId && { tripId }),
                ...(prismaStatus && { status: prismaStatus }),
            },
        });
        const formattedReservations = reservations.map((reservation) => ({
            id: reservation.id,
            userId: reservation.userId,
            tripId: reservation.tripId,
            seatId: reservation.seatId,
            status: reservation.status.toLowerCase(),
            bookedAt: reservation.bookedAt.toISOString(),
            updatedAt: reservation.updatedAt.toISOString(),
            paymentId: reservation.paymentId ?? undefined,
            user: {
                id: reservation.user.id,
                name: reservation.user.name,
                email: reservation.user.email,
            },
        }));
        return { reservations: formattedReservations, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getReservations error: ${errorMsg}`);
        throw new Error(`Failed to fetch reservations: ${errorMsg}`);
    }
}
// Fetch notifications for the owner's buses (for Reminder)
async function getNotifications({ ownerId, page = 1, pageSize = 10, filters = {}, }) {
    try {
        const { type, status } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        const notifications = await prisma_1.db.notification.findMany({
            where: {
                trip: { bus: { ownerId } },
                ...(type && { type }),
                ...(status && { status }),
            },
            include: {
                user: { select: { id: true, email: true } },
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
        });
        const total = await prisma_1.db.notification.count({
            where: {
                trip: { bus: { ownerId } },
                ...(type && { type }),
                ...(status && { status }),
            },
        });
        const formattedNotifications = notifications.map((notification) => ({
            id: notification.id,
            userId: notification.userId,
            tripId: notification.tripId ?? undefined,
            type: notification.type,
            message: notification.message,
            status: notification.status,
            createdAt: notification.createdAt.toISOString(),
            sentAt: notification.sentAt?.toISOString(),
            driverId: notification.driverId ?? undefined,
            subject: notification.subject,
        }));
        return { notifications: formattedNotifications, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getNotifications error: ${errorMsg}`);
        throw new Error(`Failed to fetch notifications: ${errorMsg}`);
    }
}
// Ensure a bus has an active trip (for testing)
async function ensureBusHasTrip(busId) {
    try {
        const trip = await prisma_1.db.trip.findFirst({
            where: { busId, status: { not: 'COMPLETED' } },
        });
        if (trip) {
            return; // Bus already has an active trip
        }
        const bus = await prisma_1.db.bus.findUnique({
            where: { id: busId },
            include: { drivers: { take: 1 } },
        });
        if (!bus || !bus.drivers.length) {
            throw new Error('Bus or driver not found');
        }
        await prisma_1.db.trip.create({
            data: {
                busId,
                driverId: bus.drivers[0].id,
                departureCity: 'Nairobi',
                arrivalCity: 'Mombasa',
                departureTime: new Date(),
                status: 'SCHEDULED',
                isFullyBooked: false,
            },
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusHasTrip error: ${errorMsg}`);
        throw new Error(`Failed to ensure bus has trip: ${errorMsg}`);
    }
}
