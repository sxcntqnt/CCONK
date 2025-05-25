// src/lib/prisma/dbUtils.ts
'use server';

import { db } from '@/lib/prisma';
import { MatatuCapacity, TripStatus } from '@prisma/client';
import { matatuConfigs, validCapacities, validateCapacity } from '@/utils/constants/matatuSeats';
import { BusWithRelations, DriverWithRelations, TripWithRelations } from './dbTypes';
import { Bus } from '@/utils';

// Define JSON types for Route fields
type PickupPoint = {
    pickup_point: string;
    pickup_latlng: { latitude: number; longitude: number };
    pickup_hexid: string;
};

type Destination = {
    destination: string;
    destination_latlng: { latitude: number; longitude: number };
    destination_hexid: string;
};

// Helper function to ensure a Route exists
export async function ensureRoute(pickup: string, destination: string): Promise<string> {
    try {
        const route = await db.route.findFirst({
            where: {
                pickup_point: {
                    equals: {
                        pickup_point: pickup,
                        pickup_latlng: { latitude: -1.286389, longitude: 36.817223 },
                        pickup_hexid: 'hexid-placeholder',
                    },
                },
                destinations: {
                    has: {
                        destination,
                        destination_latlng: { latitude: -4.043477, longitude: 39.668206 },
                        destination_hexid: 'hexid-placeholder',
                    },
                },
            },
        });

        if (route) return route.id;

        const newRoute = await db.route.create({
            data: {
                route_number: `${pickup}-${destination}`,
                pickup_point: {
                    pickup_point: pickup,
                    pickup_latlng: { latitude: -1.286389, longitude: 36.817223 }, // Nairobi
                    pickup_hexid: 'hexid-placeholder',
                },
                destinations: [
                    {
                        destination,
                        destination_latlng: { latitude: -4.043477, longitude: 39.668206 }, // Mombasa
                        destination_hexid: 'hexid-placeholder',
                    },
                ],
                helix: [],
            },
        });

        return newRoute.id;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureRoute error: ${errorMsg}`);
        throw new Error(`Failed to ensure route: ${errorMsg}`);
    }
}

export async function ensureBusHasTrip(busId: string): Promise<void> {
    try {
        const trip = await db.trip.findFirst({
            where: { busId, status: { not: TripStatus.COMPLETED } },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, image: true },
                        },
                    },
                },
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        model: true,
                        latitude: true,
                        longitude: true,
                        lastLocationUpdate: true,
                        images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                    },
                },
                reservations: {
                    include: {
                        seat: true,
                        user: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
        });

        if (trip) {
            return; // Bus already has an active trip
        }

        const bus = await db.bus.findUnique({
            where: { id: busId },
            include: { driver: true },
        });

        if (!bus || !bus.driver) {
            throw new Error('Bus or driver not found');
        }

        const routeId = await ensureRoute('Nairobi', 'Mombasa');

        await db.trip.create({
            data: {
                busId,
                driverId: bus.driver.id,
                routeId,
                destinationIndex: 0,
                departureTime: new Date(),
                status: TripStatus.SCHEDULED,
                isFullyBooked: false,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusHasTrip error: ${errorMsg}`);
        throw new Error(`Failed to ensure bus has trip: ${errorMsg}`);
    }
}

export async function ensureDriverHasTrip(driverId: string): Promise<void> {
    try {
        const trip = await db.trip.findFirst({
            where: { driverId, status: { not: TripStatus.COMPLETED } },
            include: {
                driver: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true, image: true },
                        },
                    },
                },
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                        capacity: true,
                        category: true,
                        model: true,
                        latitude: true,
                        longitude: true,
                        lastLocationUpdate: true,
                        images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
                    },
                },
                reservations: {
                    include: {
                        seat: true,
                        user: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
        });

        if (trip) {
            return; // Driver already has an active trip
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: { bus: true },
        });

        if (!driver || !driver.bus) {
            throw new Error('Driver or bus not found');
        }

        const routeId = await ensureRoute('Nairobi', 'Mombasa');

        await db.trip.create({
            data: {
                busId: driver.bus.id,
                driverId,
                routeId,
                destinationIndex: 0,
                departureTime: new Date(),
                status: TripStatus.SCHEDULED,
                isFullyBooked: false,
            },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureDriverHasTrip error: ${errorMsg}`);
        throw new Error(`Failed to ensure driver has trip: ${errorMsg}`);
    }
}

export async function ensureBusExists(): Promise<void> {
    try {
        const existingBuses = (await db.bus.findMany({
            select: { capacity: true, licensePlate: true },
        })) as Pick<Bus, 'capacity' | 'licensePlate'>[];

        const existingCapacities = new Set(existingBuses.map((bus) => bus.capacity));
        const busCreations = validCapacities
            .filter((capacity) => !existingCapacities.has(Number(capacity)))
            .map(async (capacity) => {
                const capacityNum = Number(capacity);
                if (!validateCapacity(capacityNum)) {
                    throw new Error(`Invalid capacity: ${capacity}`);
                }

                const randomLetters =
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
                const numberPart = capacity.toString().padStart(3, '0');
                const licensePlate = `K${randomLetters} ${numberPart}X`;

                // Map capacity to MatatuCapacity type
                const capacityMap: { [key: number]: MatatuCapacity } = {
                    14: 'CAPACITY_14',
                    26: 'CAPACITY_26',
                    33: 'CAPACITY_33',
                    46: 'CAPACITY_46',
                    52: 'CAPACITY_52',
                    67: 'CAPACITY_67',
                };
                const category = capacityMap[capacityNum];
                if (!category) {
                    throw new Error(`Invalid capacity for MatatuCapacity: ${capacity}`);
                }

                // Create bus first
                const bus = await db.bus.create({
                    data: {
                        licensePlate,
                        capacity: capacityNum,
                        category,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });

                // Create images with busId
                await db.image.createMany({
                    data: [
                        {
                            busId: bus.id,
                            src: `/images/${capacity}-seater.jpg`,
                            blurDataURL: `/images/${capacity}-seater-blur.jpg`,
                            alt: `Primary view of ${matatuConfigs[capacity].title}`,
                        },
                        {
                            busId: bus.id,
                            src: `/images/${capacity}-seater-side.jpg`,
                            blurDataURL: `/images/${capacity}-seater-side-blur.jpg`,
                            alt: `Side view of ${matatuConfigs[capacity].title}`,
                        },
                    ],
                });
            });

        await Promise.all(busCreations);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusExists error: ${errorMsg}`);
        throw new Error(`Failed to ensure buses exist: ${errorMsg}`);
    }
}

export async function cleanupBusData(busId: string): Promise<void> {
    try {
        await db.$transaction([
            db.reservation.deleteMany({ where: { seat: { busId } } }),
            db.seat.deleteMany({ where: { busId } }),
        ]);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`cleanupBusData error: ${errorMsg}`);
        throw new Error(`Failed to clean up bus data: ${errorMsg}`);
    }
}
