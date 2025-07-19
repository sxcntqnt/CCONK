'use server';

import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Owner, Role, MatatuCapacity, SeatCategory, SeatStatus, TripStatus } from '@/utils';
import { GeoJSON } from 'geojson';
import { OwnerWithRelations } from './dbTypes';
import { z } from 'zod';

// Types
interface Bus {
    id: string;
    licensePlate: string;
    capacity: number;
    model?: string;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: string;
    category: MatatuCapacity;
    createdAt: string;
    updatedAt: string;
    passengers: any[];
    images: { id: string; src: string; blurDataURL?: string; alt: string }[];
    seats: {
        id: string;
        seatNumber: number;
        price: number;
        row: number;
        column: number;
        category: SeatCategory;
        status: SeatStatus;
    }[];
    trips: {
        id: string;
        busId: string;
        routeId: string;
        destinationIndex: number;
        departureCity: string;
        arrivalCity: string;
        departureTime: string;
        arrivalTime?: string;
        status: TripStatus;
        isFullyBooked: boolean;
        originLatitude?: number;
        originLongitude?: number;
        destinationLatitude?: number;
        destinationLongitude?: number;
        createdAt: string;
        updatedAt: string;
    }[];
}

interface Geofence {
    id: string;
    name: string;
    h3Index: string;
    resolution: number;
    geoJson: GeoJSON;
    color: string;
    createdAt: string;
    updatedAt: string;
}

interface IncomeExpense {
    id: string;
    ownerId: string;
    type: 'income' | 'expense';
    amount: number;
    description?: string;
    recordedAt: string;
    updatedAt: string;
    owner: { id: string; userId: string };
}

interface Report {
    id: string;
    ownerId: string;
    title: string;
    description?: string;
    type: string;
    generatedAt: string;
    updatedAt: string;
    owner: { id: string; userId: string };
}

// Validation Schemas
const schemas = {
    createOwner: z.object({
        clerkId: z.string().min(1, 'Clerk ID is required'),
        authenticatedClerkId: z.string().min(1, 'Authenticated Clerk ID is required'),
    }),
    updateOwner: z.object({
        name: z
            .string()
            .min(1, 'Name must be at least 1 character')
            .max(100, 'Name cannot exceed 100 characters')
            .optional(),
        email: z.string().email('Invalid email address').optional(),
        phoneNumber: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
            .max(20)
            .optional()
            .nullable(),
    }),
    pagination: z.object({
        page: z.number().int().min(1, 'Page must be at least 1').default(1),
        pageSize: z.number().int().min(1, 'Page size must be between 1 and 100').max(100).default(10),
    }),
    filter: z.object({
        name: z.string().optional(),
        email: z.string().email('Invalid email address').optional(),
    }),
    ownerId: z.string().min(1, 'Invalid owner ID'),
};

// Custom Error
class OwnerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OwnerError';
    }
}

// Common Prisma Include Configuration
const ownerInclude: Prisma.OwnerInclude = {
    user: {
        select: {
            id: true,
            clerkId: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phoneNumber: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    buses: {
        select: {
            id: true,
            licensePlate: true,
            capacity: true,
            model: true,
            latitude: true,
            longitude: true,
            lastLocationUpdate: true,
            category: true,
            createdAt: true,
            updatedAt: true,
            passengers: true,
            images: { select: { id: true, src: true, blurDataURL: true, alt: true } },
            seats: {
                select: {
                    id: true,
                    seatNumber: true,
                    price: true,
                    row: true,
                    column: true,
                    category: true,
                    status: true,
                },
            },
            trips: {
                select: {
                    id: true,
                    busId: true,
                    routeId: true,
                    destinationIndex: true,
                    departureTime: true,
                    arrivalTime: true,
                    status: true,
                    isFullyBooked: true,
                    createdAt: true,
                    updatedAt: true,
                    route: { select: { pickup_point: true, destinations: true } },
                },
            },
        },
    },
    geofences: {
        select: {
            id: true,
            name: true,
            h3Index: true,
            resolution: true,
            geoJson: true,
            color: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    reports: {
        select: { id: true, title: true, description: true, type: true, generatedAt: true, updatedAt: true },
    },
    incomeExpenses: {
        select: { id: true, type: true, amount: true, description: true, recordedAt: true, updatedAt: true },
    },
    notifications: true,
    sentMessages: true,
    receivedMessages: true,
    organization: true,
};

// Utility Functions
function handleError(error: unknown, context: string): never {
    const errorMsg =
        error instanceof z.ZodError
            ? error.errors.map((e) => e.message).join(', ')
            : error instanceof Error
              ? error.message
              : String(error);
    console.error(`${context} error: ${errorMsg}`);
    throw new OwnerError(`Failed to ${context}: ${errorMsg}`);
}

async function checkAuthorization(
    authenticatedClerkId: string,
    roleRequired: string | string[],
    ownerId?: string,
): Promise<{ user: any; owner?: any }> {
    const user = await db.user.findUnique({
        where: { clerkId: authenticatedClerkId },
        include: { owner: true },
    });
    if (!user) throw new OwnerError('User not found');

    const roles = Array.isArray(roleRequired) ? roleRequired : [roleRequired];
    if (!roles.includes(user.role) && !(user.role === 'OWNER' && authenticatedClerkId === ownerId)) {
        throw new OwnerError('User is not authorized');
    }
    if (user.role === 'OWNER' && ownerId && user.owner?.id !== ownerId) {
        throw new OwnerError('User is not authorized for this owner');
    }

    return { user, owner: user.owner };
}

function formatBus(bus: any): Bus {
    return {
        id: bus.id,
        licensePlate: bus.licensePlate,
        capacity: bus.capacity,
        model: bus.model ?? undefined,
        latitude: bus.latitude ?? undefined,
        longitude: bus.longitude ?? undefined,
        lastLocationUpdate: bus.lastLocationUpdate?.toISOString() ?? undefined,
        category: bus.category,
        createdAt: bus.createdAt.toISOString(),
        updatedAt: bus.updatedAt.toISOString(),
        passengers: bus.passengers || [],
        images:
            bus.images?.map((img: any) => ({
                id: img.id,
                src: img.src,
                blurDataURL: img.blurDataURL ?? undefined,
                alt: img.alt,
            })) || [],
        seats:
            bus.seats?.map((seat: any) => ({
                id: seat.id,
                seatNumber: seat.seatNumber,
                price: seat.price,
                row: seat.row,
                column: seat.column,
                category: seat.category,
                status: seat.status,
            })) || [],
        trips:
            bus.trips?.map((trip: any) => ({
                id: trip.id,
                busId: trip.busId,
                routeId: trip.routeId,
                destinationIndex: trip.destinationIndex,
                departureCity: trip.route?.pickup_point?.pickup_point || '',
                arrivalCity: trip.route?.destinations?.[trip.destinationIndex]?.destination || '',
                departureTime: trip.departureTime.toISOString(),
                arrivalTime: trip.arrivalTime?.toISOString() ?? undefined,
                status: trip.status,
                isFullyBooked: trip.isFullyBooked,
                originLatitude: trip.route?.pickup_point?.pickup_latlng?.latitude ?? undefined,
                originLongitude: trip.route?.pickup_point?.pickup_latlng?.longitude ?? undefined,
                destinationLatitude:
                    trip.route?.destinations?.[trip.destinationIndex]?.destination_latlng?.latitude ?? undefined,
                destinationLongitude:
                    trip.route?.destinations?.[trip.destinationIndex]?.destination_latlng?.longitude ?? undefined,
                createdAt: trip.createdAt.toISOString(),
                updatedAt: trip.updatedAt.toISOString(),
            })) || [],
    };
}

function formatGeofence(geofence: any): Geofence {
    return {
        id: geofence.id,
        name: geofence.name,
        h3Index: geofence.h3Index,
        resolution: geofence.resolution,
        geoJson: geofence.geoJson as GeoJSON,
        color: geofence.color,
        createdAt: geofence.createdAt.toISOString(),
        updatedAt: geofence.updatedAt.toISOString(),
    };
}

function formatIncomeExpense(ie: any, ownerId: string, userId: string): IncomeExpense {
    return {
        id: ie.id,
        ownerId,
        type: ie.type as 'income' | 'expense',
        amount: ie.amount,
        description: ie.description ?? undefined,
        recordedAt: ie.recordedAt.toISOString(),
        updatedAt: ie.updatedAt.toISOString(),
        owner: { id: ownerId, userId },
    };
}

function formatReport(report: any, ownerId: string, userId: string): Report {
    return {
        id: report.id,
        ownerId,
        title: report.title,
        description: report.description ?? undefined,
        type: report.type,
        generatedAt: report.generatedAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        owner: { id: ownerId, userId },
    };
}

function formatOwner(owner: OwnerWithRelations): Owner {
    return {
        id: owner.id,
        userId: owner.userId,
        createdAt: owner.createdAt.toISOString(),
        updatedAt: owner.updatedAt.toISOString(),
        profileImageUrl: owner.user.image,
        user: {
            id: owner.user.id,
            clerkId: owner.user.clerkId,
            name: owner.user.name,
            email: owner.user.email,
            image: owner.user.image,
            phoneNumber: owner.user.phoneNumber ?? undefined,
            role: owner.user.role,
            createdAt: owner.user.createdAt.toISOString(),
            updatedAt: owner.user.updatedAt.toISOString(),
        },
        buses: owner.buses?.map(formatBus) || [],
        geofences: owner.geofences?.map(formatGeofence) || [],
        incomeExpenses: owner.incomeExpenses?.map((ie) => formatIncomeExpense(ie, owner.id, owner.userId)) || [],
        reports: owner.reports?.map((report) => formatReport(report, owner.id, owner.userId)) || [],
    };
}

// Create Owner
export async function createOwner({
    clerkId,
    authenticatedClerkId,
}: {
    clerkId: string;
    authenticatedClerkId: string;
}): Promise<Owner> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = schemas.createOwner.parse({ clerkId, authenticatedClerkId });
            await checkAuthorization(
                validatedData.authenticatedClerkId,
                ['OWNER', 'ORGANIZATION'],
                validatedData.clerkId,
            );

            const user = await tx.user.findUnique({
                where: { clerkId: validatedData.clerkId },
                select: { id: true, role: true, email: true },
            });
            if (!user) throw new OwnerError('User not found');
            if (user.role !== 'OWNER') throw new OwnerError('User must have OWNER role');

            const existingOwner = await tx.owner.findUnique({ where: { userId: user.id } });
            if (existingOwner) throw new OwnerError('Owner already exists for this user');

            const owner = await tx.owner.create({
                data: { userId: user.id, createdAt: new Date(), updatedAt: new Date() },
                include: ownerInclude,
            });

            return formatOwner(owner);
        } catch (error) {
            handleError(error, 'createOwner');
        }
    });
}

// Read Owner by ID
export async function getOwnerById(ownerId: string): Promise<Owner> {
    try {
        schemas.ownerId.parse(ownerId);
        const owner = await db.owner.findUnique({ where: { id: ownerId }, include: ownerInclude });
        if (!owner) throw new OwnerError('Owner not found');

        return formatOwner(owner);
    } catch (error) {
        handleError(error, 'getOwnerById');
    }
}

// Read Multiple Owners
export async function getOwners({
    authenticatedClerkId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    authenticatedClerkId: string;
    page?: number;
    pageSize?: number;
    filters?: { name?: string; email?: string };
}): Promise<{ owners: Owner[]; total: number }> {
    try {
        const pagination = schemas.pagination.parse({ page, pageSize });
        const validatedFilters = schemas.filter.parse(filters);
        await checkAuthorization(authenticatedClerkId, 'ORGANIZATION');

        const userFilter: any = {};
        if (validatedFilters.name) userFilter.name = { contains: validatedFilters.name, mode: 'insensitive' };
        if (validatedFilters.email) userFilter.email = { equals: validatedFilters.email };

        const where = userFilter.name || userFilter.email ? { user: userFilter } : {};

        const [owners, total] = await Promise.all([
            db.owner.findMany({
                where,
                include: ownerInclude,
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.owner.count({ where }),
        ]);

        return { owners: owners.map(formatOwner), total };
    } catch (error) {
        handleError(error, 'getOwners');
    }
}

// Update Owner
export async function updateOwner(
    authenticatedClerkId: string,
    ownerId: string,
    data: { name?: string; email?: string; phoneNumber?: string | null },
): Promise<Owner> {
    return await db.$transaction(async (tx) => {
        try {
            schemas.ownerId.parse(ownerId);
            const validatedData = schemas.updateOwner.parse(data);
            await checkAuthorization(authenticatedClerkId, ['OWNER', 'ORGANIZATION'], ownerId);

            const owner = await tx.owner.findUnique({ where: { id: ownerId }, include: { user: true } });
            if (!owner) throw new OwnerError('Owner not found');

            if (validatedData.email && validatedData.email !== owner.user.email) {
                const existingUser = await tx.user.findUnique({ where: { email: validatedData.email } });
                if (existingUser) throw new OwnerError('Email is already in use');
            }

            const updatedOwner = await tx.owner.update({
                where: { id: ownerId },
                data: {
                    user: {
                        update: {
                            name: validatedData.name ?? undefined,
                            email: validatedData.email ?? undefined,
                            phoneNumber: validatedData.phoneNumber ?? undefined,
                        },
                    },
                    updatedAt: new Date(),
                },
                include: ownerInclude,
            });

            return formatOwner(updatedOwner);
        } catch (error) {
            handleError(error, 'updateOwner');
        }
    });
}

// Delete Owner
export async function deleteOwner(authenticatedClerkId: string, ownerId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            schemas.ownerId.parse(ownerId);
            await checkAuthorization(authenticatedClerkId, ['OWNER', 'ORGANIZATION'], ownerId);

            const owner = await tx.owner.findUnique({
                where: { id: ownerId },
                include: {
                    buses: {
                        select: {
                            id: true,
                            seats: { select: { id: true, reservations: { select: { id: true } } } },
                            trips: { select: { id: true, status: true } },
                            passengers: true,
                        },
                    },
                    geofences: { select: { id: true } },
                    reports: { select: { id: true } },
                    incomeExpenses: { select: { id: true } },
                },
            });
            if (!owner) throw new OwnerError('Owner not found');

            if (owner.buses.length > 0) {
                const hasActiveTripsOrSeats = owner.buses.some(
                    (bus) =>
                        bus.trips.some((trip) => trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED') ||
                        bus.seats.some((seat) => seat.reservations.length > 0),
                );
                if (hasActiveTripsOrSeats)
                    throw new OwnerError('Cannot delete owner with active trips or reserved seats');
            }
            if (owner.geofences.length > 0) throw new OwnerError('Cannot delete owner with associated geofences');
            if (owner.reports.length > 0) throw new OwnerError('Cannot delete owner with associated reports');
            if (owner.incomeExpenses.length > 0)
                throw new OwnerError('Cannot delete owner with associated income or expenses');

            await tx.owner.delete({ where: { id: ownerId } });
        } catch (error) {
            handleError(error, 'deleteOwner');
        }
    });
}
