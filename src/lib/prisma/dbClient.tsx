// src/lib/prisma/dbClient.tsx
'use server';

import { db } from '@/lib';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Prisma } from '@prisma/client';

const DEFAULT_SEAT_PRICE = process.env.DEFAULT_SEAT_PRICE ? Number(process.env.DEFAULT_SEAT_PRICE) : 19;

interface SeatData {
    id: string;
    label: string;
    status: 'available' | 'selected' | 'reserved';
    price: number;
    row?: number;
    column?: number;
    category?: string;
}

type MatatuCapacity = keyof typeof matatuConfigs;

// Server-side function to ensure buses exist
async function ensureBusExists(): Promise<void> {
    try {
        const validCapacities = Object.keys(matatuConfigs).map(Number) as MatatuCapacity[];
        const existingBuses = await db.bus.findMany({
            select: { id: true, capacity: true, licensePlate: true },
        });

        const existingCapacities = new Set(existingBuses.map((bus) => bus.capacity));
        const busCreations = validCapacities
            .filter((capacity) => !existingCapacities.has(capacity))
            .map(async (capacity) => {
                const randomLetters =
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
                const numberPart = capacity.toString().padStart(3, '0');
                const licensePlate = `K${randomLetters} ${numberPart}X`;

                await db.bus.create({
                    data: {
                        licensePlate,
                        capacity,
                        category: `${capacity}-seater`, // Added required category
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            });

        await Promise.all(busCreations);
    } catch (error) {
        throw new Error('Failed to ensure buses exist');
    }
}

export async function initializeAllBuses() {
    await ensureBusExists();
}

export async function getBus(busId: number) {
    const bus = await db.bus.findUnique({
        where: { id: busId },
        select: { id: true, licensePlate: true, capacity: true },
    });
    if (!bus) throw new Error('Bus not found');
    return bus;
}

export async function getBuses(
    page: number = 1,
    pageSize: number = 10,
): Promise<{
    buses: { id: number; licensePlate: string; capacity: number }[];
    total: number;
}> {
    try {
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const [buses, total] = await Promise.all([
            db.bus.findMany({
                skip,
                take: pageSize,
                select: { id: true, licensePlate: true, capacity: true },
                orderBy: { id: 'asc' },
            }),
            db.bus.count(),
        ]);

        if (buses.length === 0 && total === 0) {
            console.log('No buses found, calling ensureBusExists');
            await ensureBusExists();
            const [newBuses, newTotal] = await Promise.all([
                db.bus.findMany({
                    skip,
                    take: pageSize,
                    select: { id: true, licensePlate: true, capacity: true },
                    orderBy: { id: 'asc' },
                }),
                db.bus.count(),
            ]);
            return { buses: newBuses, total: newTotal };
        }

        return { buses, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBuses error: ${errorMsg}`);
        throw new Error(`Failed to fetch buses: ${errorMsg}`);
    }
}

export async function getSeats(busId: number): Promise<Record<string, SeatData>> {
    if (!Number.isFinite(busId)) {
        throw new Error(`Invalid busId: ${busId}. Expected a valid number.`);
    }

    try {
        const busWithSeats = await db.bus.findUnique({
            where: { id: busId },
            select: {
                capacity: true,
                seats: {
                    select: {
                        id: true,
                        seatNumber: true,
                        price: true,
                        row: true,
                        column: true,
                        category: true,
                        reservations: { select: { id: true } }, // Corrected syntax
                    },
                },
            },
        });

        if (!busWithSeats || typeof busWithSeats.capacity !== 'number' || busWithSeats.capacity <= 0) {
            throw new Error(`Bus with ID ${busId} not found or has invalid capacity.`);
        }

        const dbCapacity = busWithSeats.capacity as MatatuCapacity;
        if (!(dbCapacity in matatuConfigs)) {
            (matatuConfigs as any)[dbCapacity] = {
                totalSeats: dbCapacity,
                title: `${dbCapacity}-Seater Matatu`,
                layout: Array.from({ length: Math.ceil(dbCapacity / 2) }, (_, i) => [
                    i * 2 + 1,
                    i * 2 + 2 <= dbCapacity ? i * 2 + 2 : null,
                ]).filter((row) => row[0] !== null && row[0] <= dbCapacity),
            };
        }

        const { totalSeats } = matatuConfigs[dbCapacity];

        if (busWithSeats.seats.length === 0) {
            await initializeSeats(busId, dbCapacity);
            const updatedBusWithSeats = await db.bus.findUnique({
                where: { id: busId },
                select: {
                    seats: {
                        select: {
                            id: true,
                            seatNumber: true,
                            price: true,
                            row: true,
                            column: true,
                            category: true,
                            reservations: { select: { id: true } },
                        },
                    },
                },
            });
            return buildSeatMap(updatedBusWithSeats?.seats || [], totalSeats);
        }

        return buildSeatMap(busWithSeats.seats, totalSeats);
    } catch (error) {
        throw new Error(`Failed to fetch seats: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function buildSeatMap(
    seats: {
        id: number;
        seatNumber: number;
        price: number;
        row: number;
        column: number;
        category: string;
        reservations: { id: number }[];
    }[],
    totalSeats: number,
): Record<string, SeatData> {
    const seatMap: Record<string, SeatData> = {};

    seats.forEach((seat) => {
        seatMap[String(seat.id)] = {
            id: String(seat.id),
            label: String(seat.seatNumber),
            status: seat.reservations.length > 0 ? 'reserved' : 'available',
            price: seat.price,
            row: seat.row,
            column: seat.column,
            category: seat.category,
        };
    });

    return seatMap;
}

async function initializeSeats(busId: number, capacity: MatatuCapacity): Promise<void> {
    const config = matatuConfigs[capacity];
    if (!config || !Array.isArray(config.layout)) {
        throw new Error(`Invalid configuration or layout for capacity ${capacity}`);
    }

    const seatsToCreate = config.layout.flatMap((row: number[][], rowIndex: number) =>
        row
            .flat()
            .filter(Boolean)
            .map((seatNumber: number, seatIndex: number) => ({
                busId,
                seatNumber,
                price: DEFAULT_SEAT_PRICE,
                row: rowIndex + 1,
                column: seatIndex + 1,
                category: determineSeatCategory(rowIndex, seatIndex, row.flat().length),
            })),
    );

    await db.seat.createMany({
        data: seatsToCreate,
        skipDuplicates: true,
    });
}

function determineSeatCategory(rowIndex: number, columnIndex: number, rowLength: number): string {
    if (rowLength === 1) return 'single';
    if (columnIndex === 0 || columnIndex === rowLength - 1) return 'window';
    return 'middle';
}

export async function reserveSeats(seatIds: string[]): Promise<{ success: boolean; reservedCount: number }> {
    if (!seatIds?.length) {
        throw new Error('No seats provided for reservation');
    }

    return await db.$transaction(async (tx) => {
        const existingReservations = await tx.reservation.findMany({
            where: { seatId: { in: seatIds.map((id) => Number(id)) } },
        });

        if (existingReservations.length > 0) {
            throw new Error('One or more seats are already reserved');
        }

        const seatsExist = await tx.seat.count({
            where: { id: { in: seatIds.map((id) => Number(id)) } },
        });

        if (seatsExist !== seatIds.length) {
            throw new Error('One or more seats do not exist');
        }

        const reservations = await tx.reservation.createMany({
            data: seatIds.map((seatId) => ({
                seatId: Number(seatId),
                userId: 1, // Placeholder; replace with actual user ID
                tripId: 1, // Placeholder; replace with actual trip ID
                reservedAt: new Date(),
            })),
        });

        return {
            success: true,
            reservedCount: reservations.count,
        };
    });
}

export async function resetReservations(busId: number = 1): Promise<{ success: boolean; deletedCount: number }> {
    try {
        const result = await db.reservation.deleteMany({
            where: { seat: { busId } },
        });

        return {
            success: true,
            deletedCount: result.count,
        };
    } catch (error) {
        throw new Error('Failed to reset reservations');
    }
}

export async function validateSeats(busId: number = 1): Promise<boolean> {
    try {
        const bus = await db.bus.findUnique({
            where: { id: busId },
            select: { capacity: true },
        });
        const capacity = (bus?.capacity || 14) as MatatuCapacity;
        const layout = matatuConfigs[capacity].layout;

        const seats = await db.seat.findMany({
            where: { busId },
            select: { seatNumber: true },
        });

        const dbSeatNumbers = new Set(seats.map((s) => s.seatNumber));
        const layoutSeatNumbers = new Set<number>(layout.flat(2).filter((num): num is number => num !== null));

        return (
            dbSeatNumbers.size === layoutSeatNumbers.size &&
            [...layoutSeatNumbers].every((num) => dbSeatNumbers.has(num))
        );
    } catch (error) {
        return false;
    }
}

export async function cleanupBusData(busId: number = 1): Promise<void> {
    try {
        await db.$transaction([
            db.reservation.deleteMany({ where: { seat: { busId } } }),
            db.seat.deleteMany({ where: { busId } }),
        ]);
    } catch (error) {
        throw new Error('Failed to clean up bus data');
    }
}
