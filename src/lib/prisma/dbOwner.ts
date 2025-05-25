'use server';

import { db } from '@/lib/prisma';
import { Owner, Role, MatatuCapacity, SeatCategory, SeatStatus, TripStatus } from '@/utils';
import { GeoJSON } from 'geojson';
import { OwnerWithRelations } from './dbTypes';
import { z } from 'zod';

// Validation Schemas
const createOwnerSchema = z.object({
    clerkId: z.string().min(1, 'Clerk ID is required'),
});

const updateOwnerSchema = z.object({
    name: z.string().min(1, 'Name must be at least 1 character').max(100).optional(),
    email: z.string().email('Invalid email address').optional(),
    phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
        .max(20)
        .optional()
        .nullable(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
});

// Custom Error
class OwnerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OwnerError';
    }
}

// Helper function to format Owner data
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
            phoneNumber: owner.user.phoneNumber || undefined,
            role: owner.user.role,
            createdAt: owner.user.createdAt.toISOString(),
            updatedAt: owner.user.updatedAt.toISOString(),
        },
        buses:
            owner.buses?.map(
                (bus: {
                    id: string;
                    licensePlate: string;
                    capacity: number;
                    model: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    lastLocationUpdate: Date | null;
                    category: MatatuCapacity;
                    createdAt: Date;
                    updatedAt: Date;
                    passengers: Passenger[];
                    images: Image[];
                    seats: Seat[];
                    trips: (Trip & { route: { pickup_point: any; destinations: any[] } })[];
                }) => ({
                    id: bus.id,
                    licensePlate: bus.licensePlate,
                    capacity: bus.capacity,
                    model: bus.model || undefined,
                    latitude: bus.latitude || undefined,
                    longitude: bus.longitude || undefined,
                    lastLocationUpdate: bus.lastLocationUpdate?.toISOString() || undefined,
                    category: bus.category,
                    createdAt: bus.createdAt.toISOString(),
                    updatedAt: bus.updatedAt.toISOString(),
                    passengers: bus.passengers || [],
                    images:
                        bus.images?.map((img) => ({
                            id: img.id,
                            src: img.src,
                            blurDataURL: img.blurDataURL || undefined,
                            alt: img.alt,
                        })) || [],
                    seats:
                        bus.seats?.map((seat) => ({
                            id: seat.id,
                            seatNumber: seat.seatNumber,
                            price: seat.price,
                            row: seat.row,
                            column: seat.column,
                            category: seat.category,
                            status: seat.status,
                        })) || [],
                    trips:
                        bus.trips?.map((trip) => ({
                            id: trip.id,
                            busId: trip.busId,
                            routeId: trip.routeId,
                            destinationIndex: trip.destinationIndex,
                            departureCity: trip.route.pickup_point.pickup_point,
                            arrivalCity: trip.route.destinations[trip.destinationIndex]?.destination || '',
                            departureTime: trip.departureTime.toISOString(),
                            arrivalTime: trip.arrivalTime?.toISOString() || undefined,
                            status: trip.status,
                            isFullyBooked: trip.isFullyBooked,
                            originLatitude: trip.route.pickup_point.pickup_latlng.latitude || undefined,
                            originLongitude: trip.route.pickup_point.pickup_latlng.longitude || undefined,
                            destinationLatitude:
                                trip.route.destinations[trip.destinationIndex]?.destination_latlng.latitude ||
                                undefined,
                            destinationLongitude:
                                trip.route.destinations[trip.destinationIndex]?.destination_latlng.longitude ||
                                undefined,
                            createdAt: trip.createdAt.toISOString(),
                            updatedAt: trip.updatedAt.toISOString(),
                        })) || [],
                }),
            ) || [],
        geofences:
            owner.geofences?.map((geofence) => ({
                id: geofence.id,
                name: geofence.name,
                h3Index: geofence.h3Index,
                resolution: geofence.resolution,
                geoJson: geofence.geoJson as unknown as GeoJSON,
                color: geofence.color,
                createdAt: geofence.createdAt.toISOString(),
                updatedAt: geofence.updatedAt.toISOString(),
            })) || [],
        incomeExpenses:
            owner.incomeExpenses?.map((ie) => ({
                id: ie.id,
                ownerId: owner.id,
                type: ie.type as 'income' | 'expense',
                amount: ie.amount,
                description: ie.description || undefined,
                recordedAt: ie.recordedAt.toISOString(),
                updatedAt: ie.updatedAt.toISOString(),
                owner: { id: owner.id, userId: owner.userId },
            })) || [],
        reports:
            owner.reports?.map((report) => ({
                id: report.id,
                ownerId: owner.id,
                title: report.title,
                description: report.description || undefined,
                type: report.type,
                generatedAt: report.generatedAt.toISOString(),
                updatedAt: report.updatedAt.toISOString(),
                owner: { id: owner.id, userId: owner.userId },
            })) || [],
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
            const { clerkId: validatedClerkId } = createOwnerSchema.parse({ clerkId });

            const authUser = await tx.user.findUnique({
                where: { clerkId: authenticatedClerkId },
                select: { role: true, owner: true },
            });
            if (
                !authUser ||
                (authUser.role !== 'OWNER' && authUser.role !== 'ORGANIZATION' && authenticatedClerkId !== clerkId)
            ) {
                throw new OwnerError('User is not authorized to create owners');
            }

            const user = await tx.user.findUnique({
                where: { clerkId: validatedClerkId },
                select: { id: true, role: true, email: true },
            });
            if (!user) {
                throw new OwnerError('User not found');
            }
            if (user.role !== 'OWNER') {
                throw new OwnerError('User must have OWNER role');
            }

            const existingOwner = await tx.owner.findUnique({
                where: { userId: user.id },
            });
            if (existingOwner) {
                throw new OwnerError('Owner already exists for this user');
            }

            const owner = await tx.owner.create({
                data: {
                    userId: user.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                include: {
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
                                    route: {
                                        select: {
                                            pickup_point: true,
                                            destinations: true,
                                        },
                                    },
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
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            generatedAt: true,
                            updatedAt: true,
                        },
                    },
                    incomeExpenses: {
                        select: {
                            id: true,
                            type: true,
                            amount: true,
                            description: true,
                            recordedAt: true,
                            updatedAt: true,
                        },
                    },
                    notifications: true,
                    sentMessages: true,
                    receivedMessages: true,
                    organization: true,
                },
            });

            return formatOwner(owner);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`createOwner error: ${errorMsg}`);
            throw new OwnerError(`Failed to create owner: ${errorMsg}`);
        }
    });
}

// Read Owner by ID
export async function getOwnerById(ownerId: string): Promise<Owner> {
    try {
        const owner = await db.owner.findUnique({
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
                                route: {
                                    select: {
                                        pickup_point: true,
                                        destinations: true,
                                    },
                                },
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
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        generatedAt: true,
                        updatedAt: true,
                    },
                },
                incomeExpenses: {
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        description: true,
                        recordedAt: true,
                        updatedAt: true,
                    },
                },
                notifications: true,
                sentMessages: true,
                receivedMessages: true,
                organization: true,
            },
        });

        if (!owner) {
            throw new OwnerError('Owner not found');
        }

        return formatOwner(owner);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOwnerById error: ${errorMsg}`);
        throw new OwnerError(`Failed to fetch owner: ${errorMsg}`);
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
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const authUser = await db.user.findUnique({
            where: { clerkId: authenticatedClerkId },
            select: { role: true },
        });
        if (!authUser || authUser.role !== 'ORGANIZATION') {
            throw new OwnerError('User is not authorized to fetch owners');
        }

        const userFilter: any = {};
        if (validatedFilters.name) {
            userFilter.name = { contains: validatedFilters.name, mode: 'insensitive' };
        }
        if (validatedFilters.email) {
            userFilter.email = { equals: validatedFilters.email };
        }

        const where = userFilter.name || userFilter.email ? { user: userFilter } : {};

        const [owners, total] = await Promise.all([
            db.owner.findMany({
                where,
                include: {
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
                                    route: {
                                        select: {
                                            pickup_point: true,
                                            destinations: true,
                                        },
                                    },
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
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            generatedAt: true,
                            updatedAt: true,
                        },
                    },
                    incomeExpenses: {
                        select: {
                            id: true,
                            type: true,
                            amount: true,
                            description: true,
                            recordedAt: true,
                            updatedAt: true,
                        },
                    },
                    notifications: true,
                    sentMessages: true,
                    receivedMessages: true,
                    organization: true,
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.owner.count({ where }),
        ]);

        return {
            owners: owners.map(formatOwner),
            total,
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOwners error: ${errorMsg}`);
        throw new OwnerError(`Failed to fetch owners: ${errorMsg}`);
    }
}

// Update Owner
export async function updateOwner(
    authenticatedClerkId: string,
    ownerId: string,
    data: {
        name?: string;
        email?: string;
        phoneNumber?: string | null;
    },
): Promise<Owner> {
    return await db.$transaction(async (tx) => {
        try {
            const validatedData = updateOwnerSchema.parse(data);

            const authUser = await tx.user.findUnique({
                where: { clerkId: authenticatedClerkId },
                include: { owner: true },
            });
            if (
                !authUser ||
                (authUser.role !== 'OWNER' && authUser.role !== 'ORGANIZATION') ||
                (authUser.role === 'OWNER' && authUser.owner?.id !== ownerId)
            ) {
                throw new OwnerError('User is not authorized to update this owner');
            }

            const owner = await tx.owner.findUnique({
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
                            phoneNumber: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });
            if (!owner) {
                throw new OwnerError('Owner not found');
            }

            if (validatedData.email && validatedData.email !== owner.user.email) {
                const existingUser = await tx.user.findUnique({
                    where: { email: validatedData.email },
                });
                if (existingUser) {
                    throw new OwnerError('Email is already in use');
                }
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
                include: {
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
                                    route: {
                                        select: {
                                            pickup_point: true,
                                            destinations: true,
                                        },
                                    },
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
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            generatedAt: true,
                            updatedAt: true,
                        },
                    },
                    incomeExpenses: {
                        select: {
                            id: true,
                            type: true,
                            amount: true,
                            description: true,
                            recordedAt: true,
                            updatedAt: true,
                        },
                    },
                    notifications: true,
                    sentMessages: true,
                    receivedMessages: true,
                    organization: true,
                },
            });

            return formatOwner(updatedOwner);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`updateOwner error: ${errorMsg}`);
            throw new OwnerError(`Failed to update owner: ${errorMsg}`);
        }
    });
}

// Delete Owner
export async function deleteOwner(authenticatedClerkId: string, ownerId: string): Promise<void> {
    return await db.$transaction(async (tx) => {
        try {
            const authUser = await tx.user.findUnique({
                where: { clerkId: authenticatedClerkId },
                include: { owner: true },
            });
            if (
                !authUser ||
                (authUser.role !== 'OWNER' && authUser.role !== 'ORGANIZATION') ||
                (authUser.role === 'OWNER' && authUser.owner?.id !== ownerId)
            ) {
                throw new OwnerError('User is not authorized to delete this owner');
            }

            const owner = await tx.owner.findUnique({
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
                            phoneNumber: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
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
                    notifications: true,
                    sentMessages: true,
                    receivedMessages: true,
                    organization: true,
                },
            });
            if (!owner) {
                throw new OwnerError('Owner not found');
            }

            if (owner.buses.length > 0) {
                const hasActiveTripsOrSeats = owner.buses.some(
                    (bus) =>
                        bus.trips.some((trip) => trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED') ||
                        bus.seats.some((seat) => seat.reservations.length > 0),
                );
                if (hasActiveTripsOrSeats) {
                    throw new OwnerError('Cannot delete owner with active trips or reserved seats');
                }
            }
            if (owner.geofences.length > 0) {
                throw new OwnerError('Cannot delete owner with associated geofences');
            }
            if (owner.reports.length > 0) {
                throw new OwnerError('Cannot delete owner with associated reports');
            }
            if (owner.incomeExpenses.length > 0) {
                throw new OwnerError('Cannot delete owner with associated income or expenses');
            }

            await tx.owner.delete({
                where: { id: ownerId },
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`deleteOwner error: ${errorMsg}`);
            throw new OwnerError(`Failed to delete owner: ${errorMsg}`);
        }
    });
}
