"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBus = getBus;
exports.getBuses = getBuses;
exports.getSeats = getSeats;
exports.reserveSeats = reserveSeats;
exports.resetReservations = resetReservations;
exports.validateSeats = validateSeats;
exports.cleanupBusData = cleanupBusData;
const lib_1 = require("@/lib");
const matatuSeats_1 = require("@/utils/constants/matatuSeats");
const DEFAULT_SEAT_PRICE = process.env.DEFAULT_SEAT_PRICE ? Number(process.env.DEFAULT_SEAT_PRICE) : 19;
async function fetchBuses({ skip, take, selectImages = false, licensePlate, capacity, }) {
    const buses = await lib_1.db.bus.findMany({
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
            ...(capacity ? { capacity } : { capacity: { in: matatuSeats_1.validCapacities.map(Number) } }),
            ...(licensePlate && { licensePlate }),
        },
        orderBy: { id: 'asc' },
    });
    return buses.map((bus) => ({
        ...bus,
        capacity: (0, matatuSeats_1.validateCapacity)(bus.capacity),
        images: bus.images
            ? bus.images.map((img) => ({
                src: img.src,
                blurDataURL: img.blurDataURL,
                alt: img.alt,
            }))
            : [],
    }));
}
async function ensureBusExists() {
    try {
        const existingBuses = await lib_1.db.bus.findMany({
            select: { capacity: true, licensePlate: true },
        });
        const existingCapacities = new Set(existingBuses.map((bus) => bus.capacity));
        const busCreations = matatuSeats_1.validCapacities
            .filter((capacity) => !existingCapacities.has(Number(capacity)))
            .map(async (capacity) => {
            const capacityNum = Number(capacity);
            const randomLetters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                String.fromCharCode(65 + Math.floor(Math.random() * 26));
            const numberPart = capacity.toString().padStart(3, '0');
            const licensePlate = `K${randomLetters} ${numberPart}X`;
            await lib_1.db.bus.create({
                data: {
                    licensePlate,
                    capacity: capacityNum,
                    category: matatuSeats_1.matatuConfigs[capacity].title,
                    images: {
                        create: [
                            {
                                src: `/images/${capacity}-seater.jpg`,
                                blurDataURL: `/images/${capacity}-seater-blur.jpg`,
                                alt: `Primary view of ${matatuSeats_1.matatuConfigs[capacity].title}`,
                            },
                            {
                                src: `/images/${capacity}-seater-side.jpg`,
                                blurDataURL: `/images/${capacity}-seater-side-blur.jpg`,
                                alt: `Side view of ${matatuSeats_1.matatuConfigs[capacity].title}`,
                            },
                        ],
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        });
        await Promise.all(busCreations);
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureBusExists error: ${errorMsg}`);
        throw new Error(`Failed to ensure buses exist: ${errorMsg}`);
    }
}
async function getBus(busId) {
    try {
        const bus = await lib_1.db.bus.findUnique({
            where: { id: busId },
            select: {
                id: true,
                licensePlate: true,
                capacity: true,
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
        return {
            ...bus,
            capacity: (0, matatuSeats_1.validateCapacity)(bus.capacity),
            images: bus.images.length > 0
                ? bus.images.map((img) => ({
                    src: img.src,
                    blurDataURL: img.blurDataURL,
                    alt: img.alt,
                }))
                : [{ src: '/placeholder.jpg', blurDataURL: null, alt: 'Vehicle placeholder' }],
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBus error: ${errorMsg}`);
        throw new Error(`Failed to fetch bus: ${errorMsg}`);
    }
}
async function getBuses(page = 1, pageSize = 10, filters = {}) {
    try {
        const { licensePlate, capacity } = filters;
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }
        let buses = await fetchBuses({
            skip,
            take: licensePlate ? 1 : pageSize,
            selectImages: true,
            licensePlate,
            capacity,
        });
        const total = await lib_1.db.bus.count({
            where: {
                ...(capacity ? { capacity } : { capacity: { in: matatuSeats_1.validCapacities.map(Number) } }),
                ...(licensePlate && { licensePlate }),
            },
        });
        if (buses.length === 0 && total === 0 && !licensePlate && !capacity) {
            await ensureBusExists();
            buses = await fetchBuses({
                skip,
                take: pageSize,
                selectImages: true,
            });
        }
        const typedBuses = buses.map((bus) => ({
            id: bus.id,
            licensePlate: bus.licensePlate,
            capacity: bus.capacity,
            category: bus.category,
            imageUrl: bus.images[0]?.src ?? '/placeholder.jpg',
        }));
        return { buses: typedBuses, total };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getBuses error: ${errorMsg}`);
        throw new Error(`Failed to fetch buses: ${errorMsg}`);
    }
}
async function getSeats(busId) {
    if (!Number.isFinite(busId)) {
        throw new Error(`Invalid busId: ${busId}. Expected a valid number.`);
    }
    try {
        const busWithSeats = await lib_1.db.bus.findUnique({
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
                        status: true,
                        reservations: { select: { id: true } },
                    },
                },
            },
        });
        if (!busWithSeats || typeof busWithSeats.capacity !== 'number' || busWithSeats.capacity <= 0) {
            throw new Error(`Bus with ID ${busId} not found or has invalid capacity.`);
        }
        const dbCapacity = (0, matatuSeats_1.validateCapacity)(busWithSeats.capacity);
        if (!(dbCapacity in matatuSeats_1.matatuConfigs)) {
            throw new Error(`Unsupported bus capacity: ${dbCapacity}. Supported capacities: ${Object.keys(matatuSeats_1.matatuConfigs).join(', ')}`);
        }
        const { totalSeats } = matatuSeats_1.matatuConfigs[dbCapacity];
        if (busWithSeats.seats.length === 0) {
            await initializeSeats(busId, dbCapacity);
            const updatedBusWithSeats = await lib_1.db.bus.findUnique({
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
                            status: true,
                            reservations: { select: { id: true } },
                        },
                    },
                },
            });
            return buildSeatMap(updatedBusWithSeats?.seats || [], totalSeats);
        }
        return buildSeatMap(busWithSeats.seats, totalSeats);
    }
    catch (error) {
        throw new Error(`Failed to fetch seats: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function buildSeatMap(seats, totalSeats) {
    const seatMap = {};
    seats.forEach((seat) => {
        seatMap[String(seat.id)] = {
            id: String(seat.id),
            label: String(seat.seatNumber),
            status: seat.status === 'reserved' ? 'reserved' : 'available',
            price: seat.price,
            row: seat.row,
            column: seat.column,
            category: seat.category,
        };
    });
    return seatMap;
}
function determineSeatCategory(rowIndex, columnIndex, rowLength) {
    if (rowLength === 1)
        return 'single';
    if (columnIndex === 0 || columnIndex === rowLength - 1)
        return 'window';
    if (columnIndex === 1 || columnIndex === rowLength - 2)
        return 'aisle';
    return 'middle';
}
async function initializeSeats(busId, capacity) {
    const config = matatuSeats_1.matatuConfigs[capacity];
    if (!config || !Array.isArray(config.layout)) {
        throw new Error(`Invalid configuration or layout for capacity ${capacity}`);
    }
    const seatsToCreate = config.layout.flatMap((row, rowIndex) => row
        .flat()
        .filter(Boolean)
        .map((seatNumber, seatIndex) => ({
        busId,
        seatNumber,
        price: DEFAULT_SEAT_PRICE,
        row: rowIndex + 1,
        column: seatIndex + 1,
        category: determineSeatCategory(rowIndex, seatIndex, row.flat().length),
        status: 'available',
    })));
    await lib_1.db.seat.createMany({
        data: seatsToCreate,
        skipDuplicates: true,
    });
}
async function reserveSeats(seatIds) {
    if (!seatIds?.length) {
        throw new Error('No seats provided for reservation');
    }
    return await lib_1.db.$transaction(async (tx) => {
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
        await tx.seat.updateMany({
            where: { id: { in: seatIds.map((id) => Number(id)) } },
            data: { status: 'reserved' },
        });
        return {
            success: true,
            reservedCount: reservations.count,
        };
    });
}
async function resetReservations(busId = 1) {
    try {
        const result = await lib_1.db.$transaction([
            lib_1.db.reservation.deleteMany({
                where: { seat: { busId } },
            }),
            lib_1.db.seat.updateMany({
                where: { busId },
                data: { status: 'available' },
            }),
        ]);
        return {
            success: true,
            deletedCount: result[0].count,
        };
    }
    catch (error) {
        throw new Error('Failed to reset reservations');
    }
}
async function validateSeats(busId = 1) {
    try {
        const bus = await lib_1.db.bus.findUnique({
            where: { id: busId },
            select: { capacity: true },
        });
        const capacity = (0, matatuSeats_1.validateCapacity)(bus?.capacity || 14);
        if (!(capacity in matatuSeats_1.matatuConfigs)) {
            return false;
        }
        const layout = matatuSeats_1.matatuConfigs[capacity].layout;
        const seats = await lib_1.db.seat.findMany({
            where: { busId },
            select: { seatNumber: true },
        });
        const dbSeatNumbers = new Set(seats.map((s) => s.seatNumber));
        const layoutSeatNumbers = new Set(layout.flat(2).filter((num) => num !== null));
        return (dbSeatNumbers.size === layoutSeatNumbers.size &&
            [...layoutSeatNumbers].every((num) => dbSeatNumbers.has(num)));
    }
    catch (error) {
        return false;
    }
}
async function cleanupBusData(busId = 1) {
    try {
        await lib_1.db.$transaction([
            lib_1.db.reservation.deleteMany({ where: { seat: { busId } } }),
            lib_1.db.seat.deleteMany({ where: { busId } }),
        ]);
    }
    catch (error) {
        throw new Error('Failed to clean up bus data');
    }
}
