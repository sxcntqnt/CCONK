"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerData = getOwnerData;
const lib_1 = require("@/lib");
async function getOwnerData(clerkId) {
    const owner = (await lib_1.db.user.findUnique({
        where: { clerkId },
        include: {
            owner: {
                include: {
                    buses: {
                        include: {
                            trips: {
                                where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
                                orderBy: { departureTime: 'desc' },
                            },
                            drivers: true,
                        },
                    },
                    incomeExpenses: true,
                    geofences: true,
                    reports: true,
                },
            },
            reservations: true,
        },
    }));
    if (!owner || owner.role !== 'OWNER' || !owner.owner) {
        throw new Error('User is not an owner or has no owner profile');
    }
    const trips = owner.owner.buses.flatMap((bus) => bus.trips.map((trip) => ({
        id: trip.id,
        busId: trip.busId,
        driverId: trip.driverId,
        departureCity: trip.departureCity,
        arrivalCity: trip.arrivalCity,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status.toLowerCase(),
        isFullyBooked: trip.isFullyBooked,
        originLatitude: trip.originLatitude,
        originLongitude: trip.originLongitude,
        destinationLatitude: trip.destinationLatitude,
        destinationLongitude: trip.destinationLongitude,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        bus: trip.bus,
    })));
    const drivers = owner.owner.buses.flatMap((bus) => bus.drivers);
    return {
        trips,
        buses: owner.owner.buses,
        drivers,
        reservations: owner.reservations.map((reservation) => ({
            id: reservation.id,
            userId: reservation.userId,
            tripId: reservation.tripId,
            seatId: reservation.seatId,
            status: reservation.status.toLowerCase(),
            bookedAt: reservation.bookedAt,
            updatedAt: reservation.updatedAt,
            paymentId: reservation.paymentId,
        })),
        incomeExpenses: owner.owner.incomeExpenses,
        geofences: owner.owner.geofences,
        reports: owner.owner.reports,
        users: [],
    };
}
