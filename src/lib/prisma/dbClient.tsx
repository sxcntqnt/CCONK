// src/lib/prisma/dbClient.tsx
'use server';

import { db } from '@/lib';
import { matatuConfigs, MatatuCapacity } from '@/utils/constants/matatuSeats';
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

type BusBase = {
    id: number;
    licensePlate: string;
    capacity: number;
    category: string;
};

type BusImage = {
    src: string;
    blurDataURL: string;
    alt: string;
};

// Shared validation for capacities
const validCapacities: MatatuCapacity[] = Object.keys(matatuConfigs) as MatatuCapacity[];

export async function validateCapacity(capacity: number | string | null | undefined): Promise<MatatuCapacity> {
    const validCapacities = Object.keys(matatuConfigs) as MatatuCapacity[];
    const capacityStr = String(capacity);

    if (validCapacities.includes(capacityStr as MatatuCapacity)) {
        return capacityStr as MatatuCapacity;
    }

    console.warn(`Invalid capacity ${capacity}, defaulting to '14'`);
    return '14'; // Default to 14-seater
}

// Shared bus query logic
async function fetchBuses({
    skip,
    take,
    selectImages = false,
    licensePlate,
    capacity,
}: {
    skip?: number;
    take?: number;
    selectImages?: boolean;
    licensePlate?: string;
    capacity?: number;
}): Promise<BusBase & { images: { src: string; blurDataURL?: string; alt: string }[] }[]> {
    return db.bus.findMany({
        skip,
        take,
        select: {
            id: true,
            licensePlate: true,
            capacity: true,
            category: true,
            ...(selectImages && {
                images: {
                    select: {
                        src: true,
                        blurDataURL: true,
                        alt: true,
                    },
                },
            }),
        },
        where: {
            ...(capacity ? { capacity } : { capacity: { in: validCapacities.map(Number) } }),
            ...(licensePlate && { licensePlate }),
        },
        orderBy: { id: 'asc' },
    });
}

// Ensure buses exist for each valid capacity
async function ensureBusExists(): Promise<void> {
    try {
        const existingBuses = await db.bus.findMany({
            select: { capacity: true, licensePlate: true },
        });

        const existingCapacities = new Set(existingBuses.map((bus) => bus.capacity));
        const busCreations = validCapacities
            .filter((capacity) => !existingCapacities.has(Number(capacity)))
            .map(async (capacity) => {
                const capacityNum = Number(capacity);
                const randomLetters =
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    String.fromCharCode(65 + Math.floor(Math.random() * 26));
                const numberPart = capacity.toString().padStart(3, '0');
                const licensePlate = `K${randomLetters} ${numberPart}X`;

                await db.bus.create({
                    data: {
                        licensePlate,
                        capacity: capacityNum,
                        category: matatuConfigs[capacity].title,
                        images: {
                            create: [
                                {
                                    src: `/images/${capacity}-seater.jpg`,
                                    blurDataURL: `/images/${capacity}-seater-blur.jpg`,
                                    alt: `Primary view of ${matatuConfigs[capacity].title}`,
                                },
                                {
                                    src: `/images/${capacity}-seater-side.jpg`,
                                    blurDataURL: `/images/${capacity}-seater-side-blur.jpg`,
                                    alt: `Side view of ${matatuConfigs[capacity].title}`,
                                },
                            ],
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            });

        await Promise.all(busCreations);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusExists error: ${errorMsg}`);
        throw new Error(`Failed to ensure buses exist: ${errorMsg}`);
    }
}

export async function getBus(busId: number): Promise<{
    id: number;
    licensePlate: string;
    capacity: MatatuCapacity;
    category: string;
    images: { src: string; blurDataURL: string; alt: string }[];
} | null> {
    try {
        const bus = await db.bus.findUnique({
            where: { id: busId },
            select: {
                id: true,
                licensePlate: true,
                capacity: true, // Ensure capacity is selected
                category: true,
                images: {
                    select: {
                        src: true,
                        blurDataURL: true,
                        alt: true,
                    },
                },
            },
        });

        if (!bus) {
            throw new Error('Bus not found');
        }

        const images =
            bus.images.length > 0
                ? bus.images.map((img) => ({
                      src: img.src,
                      blurDataURL: img.blurDataURL || '/placeholder.jpg',
                      alt: img.alt,
                  }))
                : [{ src: '/placeholder.jpg', blurDataURL: '/placeholder.jpg', alt: 'Vehicle placeholder' }];

        return {
            ...bus,
            capacity: validateCapacity(bus.capacity), // Uses updated validateCapacity
            images,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBus error: ${errorMsg}`);
        throw new Error(`Failed to fetch bus: ${errorMsg}`);
    }
}

export async function getBuses(
    page: number = 1,
    pageSize: number = 10,
    filters: { licensePlate?: string; capacity?: number } = {},
): Promise<{
    buses: { id: number; licensePlate: string; capacity: MatatuCapacity; category: string; imageUrl?: string }[];
    total: number;
}> {
    try {
        const { licensePlate, capacity } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        let buses = await fetchBuses({
            skip,
            take: licensePlate ? 1 : pageSize, // Limit to 1 for unique licensePlate
            selectImages: true,
            licensePlate,
            capacity,
        });

        const total = await db.bus.count({
            where: {
                ...(capacity ? { capacity } : { capacity: { in: validCapacities.map(Number) } }), // Convert to numbers
                ...(licensePlate && { licensePlate }),
            },
        });

        if (buses.length === 0 && total === 0 && !licensePlate && !capacity) {
            await initializeAllBuses();
            buses = await fetchBuses({
                skip,
                take: pageSize,
                selectImages: true,
            });
        }

        const typedBuses = buses.map((bus) => ({
            id: bus.id,
            licensePlate: bus.licensePlate,
            capacity: validateCapacity(bus.capacity),
            category: bus.category,
            imageUrl: bus.images[0]?.src ?? '/placeholder.jpg',
        }));

        return { buses: typedBuses, total };
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
                        reservations: { select: { id: true } },
                    },
                },
            },
        });

        if (!busWithSeats || typeof busWithSeats.capacity !== 'number' || busWithSeats.capacity <= 0) {
            throw new Error(`Bus with ID ${busId} not found or has invalid capacity.`);
        }

        const dbCapacity = validateCapacity(busWithSeats.capacity); // Returns string "14", "26", etc.
        if (!(dbCapacity in matatuConfigs)) {
            throw new Error(
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
        const capacity = validateCapacity(bus?.capacity || 14); // Returns string "14", "26", etc.
        if (!(capacity in matatuConfigs)) {
            return false; // Invalid capacity
        }

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
export const getServerSideProps: GetServerSideProps = async (context) => {
    const licensePlate = (context.query.licensePlate as string) || '';
    const categories = Object.entries(matatuConfigs).map(([key, config]) => ({
        key: key as MatatuCapacity,
        title: config.title,
    }));

    const searchResults = licensePlate.trim()
        ? await getVehiclesByCategory({ licensePlate: licensePlate.trim() })
        : null;

    return {
        props: {
            categories,
            searchResults,
            licensePlate,
        },
    };
};
