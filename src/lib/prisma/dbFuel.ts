'use server';

import { db } from '@/lib/prisma';
import { Fuel, Role } from '@/utils';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation Schemas
const fuelSchema = z.object({
    busId: z.string().uuid('Bus ID must be a valid UUID'),
    fuelQuantity: z.number().positive('Fuel quantity must be positive'),
    odometerReading: z.number().nonnegative('Odometer reading must be non-negative'),
    fuelPrice: z.number().positive('Fuel price must be positive'),
    fuelFillDate: z.date({ coerce: true }).refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid fuel fill date',
    }),
    fuelAddedBy: z.string().min(1, 'Fuel added by is required'),
    fuelComments: z.string().optional().nullable(),
});

const updateFuelSchema = z.object({
    fuelQuantity: z.number().positive('Fuel quantity must be positive').optional(),
    odometerReading: z.number().nonnegative('Odometer reading must be non-negative').optional(),
    fuelPrice: z.number().positive('Fuel price must be positive').optional(),
    fuelFillDate: z
        .date({ coerce: true })
        .refine((date) => !isNaN(date.getTime()), { message: 'Invalid fuel fill date' })
        .optional(),
    fuelAddedBy: z.string().min(1, 'Fuel added by is required').optional(),
    fuelComments: z.string().optional().nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.string().uuid('Bus ID must be a valid UUID').optional(),
    fuelFillDate: z
        .string()
        .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Invalid fuel fill date' })
        .optional(),
});

const driverFuelSchema = z.object({
    driverId: z.string().uuid('Driver ID must be a valid UUID'),
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

// Custom Error
class FuelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FuelError';
    }
}

// Helper function to format a fuel record
function formatFuel(record: any): Fuel {
    return {
        id: record.id,
        busId: record.busId,
        fuelQuantity: record.fuelQuantity,
        odometerReading: record.odometerReading,
        fuelPrice: record.fuelPrice,
        fuelFillDate: record.fuelFillDate.toISOString(),
        fuelAddedBy: record.fuelAddedBy,
        fuelComments: record.fuelComments ?? undefined,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        bus: {
            id: record.bus.id,
            licensePlate: record.bus.licensePlate,
        },
    };
}

// Create a fuel record
export async function createFuel(
    clerkId: string,
    {
        busId,
        fuelQuantity,
        odometerReading,
        fuelPrice,
        fuelFillDate,
        fuelAddedBy,
        fuelComments,
    }: {
        busId: string;
        fuelQuantity: number;
        odometerReading: number;
        fuelPrice: number;
        fuelFillDate: Date | string;
        fuelAddedBy: string;
        fuelComments?: string;
    },
): Promise<Fuel> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = fuelSchema.parse({
                busId,
                fuelQuantity,
                odometerReading,
                fuelPrice,
                fuelFillDate,
                fuelAddedBy,
                fuelComments,
            });

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: { include: { buses: { select: { id: true } } } }, driver: true },
            });
            if (!user || (user.role !== 'OWNER' && user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
                throw new FuelError('User is not authorized to create fuel records');
            }

            const bus = await tx.bus.findUnique({
                where: { id: validatedData.busId },
                include: { owner: { select: { id: true } }, driver: { select: { id: true } } },
            });
            if (!bus) {
                throw new FuelError(`Bus with ID ${validatedData.busId} not found`);
            }

            if (user.role === 'OWNER' && user.owner?.id !== bus.ownerId) {
                throw new FuelError('User does not own this bus');
            }
            if (user.role === 'DRIVER' && bus.driver?.id !== user.driver?.id) {
                throw new FuelError('Driver is not assigned to this bus');
            }

            const fuel = await tx.fuel.create({
                data: {
                    busId: validatedData.busId,
                    fuelQuantity: validatedData.fuelQuantity,
                    odometerReading: validatedData.odometerReading,
                    fuelPrice: validatedData.fuelPrice,
                    fuelFillDate: validatedData.fuelFillDate,
                    fuelAddedBy: validatedData.fuelAddedBy,
                    fuelComments: validatedData.fuelComments ?? undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
            });

            console.log(`Fuel record ${fuel.id} created for bus ${validatedData.busId} by ${clerkId}`);
            return formatFuel(fuel);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`createFuel error: ${errorMsg}`);
            throw new FuelError(`Failed to create fuel record: ${errorMsg}`);
        }
    });
}

// Add a fuel record (alternative creation function, maintained for compatibility)
export async function addFuelRecord({
    ownerId,
    busId,
    fuelQuantity,
    odometerReading,
    fuelPrice,
    fuelFillDate,
    fuelAddedBy,
    fuelComments,
    clerkId,
}: {
    ownerId: string;
    busId: string;
    fuelQuantity: number;
    odometerReading: number;
    fuelPrice: number;
    fuelFillDate: string;
    fuelAddedBy: string;
    fuelComments?: string;
    clerkId: string;
}): Promise<Fuel> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = fuelSchema.parse({
                busId,
                fuelQuantity,
                odometerReading,
                fuelPrice,
                fuelFillDate,
                fuelAddedBy,
                fuelComments,
            });

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: true },
            });
            if (!user || user.role !== 'OWNER' || !user.owner) {
                throw new FuelError('User is not authorized to add fuel records');
            }
            if (user.owner.id !== ownerId) {
                throw new FuelError('User does not match the specified owner ID');
            }

            const bus = await tx.bus.findFirst({
                where: { id: validatedData.busId, ownerId },
            });
            if (!bus) {
                throw new FuelError(`Bus with ID ${validatedData.busId} not found or not owned by owner ${ownerId}`);
            }

            const fuel = await tx.fuel.create({
                data: {
                    busId: validatedData.busId,
                    fuelQuantity: validatedData.fuelQuantity,
                    odometerReading: validatedData.odometerReading,
                    fuelPrice: validatedData.fuelPrice,
                    fuelFillDate: validatedData.fuelFillDate,
                    fuelAddedBy: validatedData.fuelAddedBy,
                    fuelComments: validatedData.fuelComments ?? undefined,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
            });

            console.log(`Fuel record ${fuel.id} added for bus ${validatedData.busId} by ${clerkId}`);
            return formatFuel(fuel);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`addFuelRecord error: ${errorMsg}`);
            throw new FuelError(`Failed to add fuel record: ${errorMsg}`);
        }
    });
}

// Get fuel records with pagination and filters
export async function getFuelRecords({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
    clerkId,
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { busId?: string; fuelFillDate?: string };
    clerkId: string;
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || user.role !== 'OWNER' || !user.owner) {
            throw new FuelError('User is not authorized to fetch fuel records');
        }
        if (user.owner.id !== ownerId) {
            throw new FuelError('User does not match the specified owner ID');
        }

        let fuelFillDateFilter: Date | undefined;
        if (validatedFilters.fuelFillDate) {
            fuelFillDateFilter = new Date(validatedFilters.fuelFillDate);
            if (isNaN(fuelFillDateFilter.getTime())) {
                throw new FuelError(`Invalid fuelFillDate format: ${validatedFilters.fuelFillDate}`);
            }
        }

        const where: Prisma.FuelWhereInput = {
            bus: { ownerId },
            ...(validatedFilters.busId && { busId: validatedFilters.busId }),
            ...(fuelFillDateFilter && {
                fuelFillDate: {
                    gte: new Date(fuelFillDateFilter.setHours(0, 0, 0, 0)),
                    lte: new Date(fuelFillDateFilter.setHours(23, 59, 59, 999)),
                },
            }),
        };

        const [fuelRecords, total] = await Promise.all([
            db.fuel.findMany({
                where,
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { fuelFillDate: 'desc' },
            }),
            db.fuel.count({ where }),
        ]);

        const formattedFuelRecords = fuelRecords.map(formatFuel);
        return { fuelRecords: formattedFuelRecords, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getFuelRecords error: ${errorMsg}`);
        throw new FuelError(`Failed to fetch fuel records: ${errorMsg}`);
    }
}

// Get a single fuel record by ID
export async function getFuelRecordById(clerkId: string, fuelId: string): Promise<Fuel> {
    try {
        if (!fuelId || typeof fuelId !== 'string') {
            throw new FuelError('Invalid fuel record ID');
        }
        if (!clerkId || typeof clerkId !== 'string') {
            throw new FuelError('Invalid clerk ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: { include: { buses: { select: { id: true } } } }, driver: true },
        });
        if (!user || (user.role !== 'OWNER' && user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
            throw new FuelError('User is not authorized to access fuel records');
        }

        const fuelRecord = await db.fuel.findUnique({
            where: { id: fuelId },
            include: {
                bus: { select: { id: true, licensePlate: true, ownerId: true, driver: { select: { id: true } } } },
            },
        });

        if (!fuelRecord) {
            throw new FuelError(`Fuel record with ID ${fuelId} not found`);
        }

        if (user.role === 'OWNER' && user.owner?.id !== fuelRecord.bus.ownerId) {
            throw new FuelError('User does not own the bus associated with this fuel record');
        }
        if (user.role === 'DRIVER' && fuelRecord.bus.driver?.id !== user.driver?.id) {
            throw new FuelError('Driver is not assigned to the bus associated with this fuel record');
        }

        return formatFuel(fuelRecord);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getFuelRecordById error: ${errorMsg}`);
        throw new FuelError(`Failed to fetch fuel record: ${errorMsg}`);
    }
}

// Update a fuel record
export async function updateFuelRecord(
    clerkId: string,
    fuelId: string,
    data: Partial<{
        fuelQuantity: number;
        odometerReading: number;
        fuelPrice: number;
        fuelFillDate: string;
        fuelAddedBy: string;
        fuelComments: string | null;
    }>,
): Promise<Fuel> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = updateFuelSchema.parse(data);
            if (!fuelId || typeof fuelId !== 'string') {
                throw new FuelError('Invalid fuel record ID');
            }
            if (!clerkId || typeof clerkId !== 'string') {
                throw new FuelError('Invalid clerk ID');
            }

            const user = await tx.user.findUnique({
                where: { clerkId },
                include: { owner: { include: { buses: { select: { id: true } } } }, driver: true },
            });
            if (!user || (user.role !== 'OWNER' && user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
                throw new FuelError('User is not authorized to update fuel records');
            }

            const fuelRecord = await tx.fuel.findUnique({
                where: { id: fuelId },
                include: {
                    bus: { select: { id: true, licensePlate: true, ownerId: true, driver: { select: { id: true } } } },
                },
            });
            if (!fuelRecord) {
                throw new FuelError(`Fuel record with ID ${fuelId} not found`);
            }

            if (user.role === 'OWNER' && user.owner?.id !== fuelRecord.bus.ownerId) {
                throw new FuelError('User does not own the bus associated with this fuel record');
            }
            if (user.role === 'DRIVER' && fuelRecord.bus.driver?.id !== user.driver?.id) {
                throw new FuelError('Driver is not assigned to the bus associated with this fuel record');
            }

            const updateData: Prisma.FuelUpdateInput = {
                fuelQuantity: validatedData.fuelQuantity ?? undefined,
                odometerReading: validatedData.odometerReading ?? undefined,
                fuelPrice: validatedData.fuelPrice ?? undefined,
                fuelFillDate: validatedData.fuelFillDate ?? undefined,
                fuelAddedBy: validatedData.fuelAddedBy ?? undefined,
                fuelComments: validatedData.fuelComments ?? undefined,
                updatedAt: new Date(),
            };

            const updatedFuel = await tx.fuel.update({
                where: { id: fuelId },
                data: updateData,
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
            });

            console.log(`Fuel record ${fuelId} updated by ${clerkId}`);
            return formatFuel(updatedFuel);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`updateFuelRecord error: ${errorMsg}`);
            throw new FuelError(`Failed to update fuel record: ${errorMsg}`);
        }
    });
}

// Get fuel records for a driver’s assigned bus
export async function getFuelRecordsForDriver({
    driverId,
    clerkId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: string;
    clerkId: string;
    page?: number;
    pageSize?: number;
    filters?: { fuelFillDate?: string };
}): Promise<{ fuelRecords: Fuel[]; total: number }> {
    try {
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== 'DRIVER' && user.role !== 'ORGANIZATION')) {
            throw new FuelError('User is not authorized to fetch fuel records');
        }
        if (user.role === 'DRIVER' && user.driver?.id !== driverId) {
            throw new FuelError('User is not authorized for this driver');
        }

        const driver = await db.driver.findUnique({
            where: { id: driverId },
            include: { bus: { select: { id: true } } },
        });
        if (!driver?.bus) {
            return { fuelRecords: [], total: 0 };
        }

        let fuelFillDateFilter: Date | undefined;
        if (validatedFilters.fuelFillDate) {
            fuelFillDateFilter = new Date(validatedFilters.fuelFillDate);
            if (isNaN(fuelFillDateFilter.getTime())) {
                throw new FuelError(`Invalid fuelFillDate format: ${validatedFilters.fuelFillDate}`);
            }
        }

        const where: Prisma.FuelWhereInput = {
            busId: driver.bus.id,
            ...(fuelFillDateFilter && {
                fuelFillDate: {
                    gte: new Date(fuelFillDateFilter.setHours(0, 0, 0, 0)),
                    lte: new Date(fuelFillDateFilter.setHours(23, 59, 59, 999)),
                },
            }),
        };

        const [fuelRecords, total] = await Promise.all([
            db.fuel.findMany({
                where,
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { fuelFillDate: 'desc' },
            }),
            db.fuel.count({ where }),
        ]);

        const formattedFuelRecords = fuelRecords.map(formatFuel);
        return { fuelRecords: formattedFuelRecords, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getFuelRecordsForDriver error: ${errorMsg}`);
        throw new FuelError(`Failed to fetch fuel records for driver: ${errorMsg}`);
    }
}
