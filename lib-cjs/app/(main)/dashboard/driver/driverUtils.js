"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverData = getDriverData;
exports.handleArrival = handleArrival;
const lib_1 = require("@/lib");
const notify_driver_arrival_1 = require("@/actions/notify-driver-arrival");
// Fetch driver and trip data server-side
async function getDriverData(clerkId) {
    const driver = await lib_1.db.user.findUnique({
        where: { clerkId },
        include: {
            driver: {
                include: {
                    trips: {
                        where: { status: { in: ['scheduled', 'in_progress'] }, arrivalTime: null },
                        include: { bus: true },
                        orderBy: { departureTime: 'desc' },
                        take: 1, // Most recent active trip
                    },
                },
            },
        },
    });
    if (!driver || driver.role !== 'DRIVER' || !driver.driver) {
        throw new Error('User  is not a driver or has no driver profile');
    }
    return {
        driver,
        trip: driver.driver.trips[0] || null, // Active trip or null
    };
}
// Server action wrapper for notifyDriverArrival
async function handleArrival(formData) {
    'use server';
    await (0, notify_driver_arrival_1.notifyDriverArrival)(formData);
}
