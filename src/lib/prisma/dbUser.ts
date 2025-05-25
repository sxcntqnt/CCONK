// src/lib/prisma/dbUser.ts
'use server';

import { db } from '@/lib/prisma';
import { User, ROLES, Role } from '@/utils';
import { z } from 'zod';
import { UserWithRelations } from './dbTypes';

// Utility function to map UserWithRelations to User
function mapUserWithRelationsToUser(user: UserWithRelations): User {
    return {
        id: user.id,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image ?? '/default-user.png', // Fallback to ensure string
        phoneNumber: user.phoneNumber ?? undefined,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

// Zod schemas for input validation
const CreateUserSchema = z.object({
    clerkId: z.string().min(1, 'Clerk ID is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().optional().nullable(),
    image: z.string().optional(),
});

const UpdateUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    phoneNumber: z.string().optional().nullable(),
    image: z.string().optional(),
});

// Create a new passenger user
export async function createUser(input: z.infer<typeof CreateUserSchema>): Promise<User> {
    try {
        // Validate input
        const validatedInput = CreateUserSchema.parse(input);

        // Check if clerkId is already taken
        const existingClerkUser = await db.user.findUnique({
            where: { clerkId: validatedInput.clerkId },
        });
        if (existingClerkUser) {
            throw new Error('Clerk ID is already in use');
        }

        // Check if email is already taken
        const existingUser = await db.user.findUnique({
            where: { email: validatedInput.email },
        });
        if (existingUser) {
            throw new Error('Email is already in use');
        }

        const user = await db.user.create({
            data: {
                clerkId: validatedInput.clerkId,
                firstName: validatedInput.firstName,
                lastName: validatedInput.lastName,
                email: validatedInput.email,
                image: validatedInput.image ?? '/default-user.png',
                phoneNumber: validatedInput.phoneNumber ?? null,
                role: ROLES.PASSENGER,
            },
        });

        // Create passenger record
        const newPassenger = await db.passenger.create({
            data: { userId: user.id },
        });

        return mapUserWithRelationsToUser({
            ...user,
            passenger: {
                id: newPassenger.id,
                userId: newPassenger.userId,
                busId: null,
                createdAt: newPassenger.createdAt,
                updatedAt: newPassenger.updatedAt,
            },
            driver: null,
            owner: null,
            organization: null,
            reservations: [],
            notifications: [],
            sentMessages: [],
            receivedMessages: [],
            geofences: [],
            payments: [],
        });
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`createUser error: ${errorMsg}`);
        throw new Error(`Failed to create user: ${errorMsg}`);
    }
}

// Fetch multiple passenger users
export async function getUserRecords({
    clerkId,
    page = 1,
    pageSize = 10,
}: {
    clerkId: string;
    page?: number;
    pageSize?: number;
}): Promise<{ users: User[]; total: number }> {
    try {
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const users = (await db.user.findMany({
            where: { clerkId, role: ROLES.PASSENGER },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                passenger: { select: { id: true, userId: true, busId: true, createdAt: true, updatedAt: true } },
                reservations: {
                    select: {
                        id: true,
                        tripId: true,
                        seatId: true,
                        status: true,
                        bookedAt: true,
                        updatedAt: true,
                        successfulPaymentId: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                sentMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                receivedMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                payments: {
                    select: {
                        id: true,
                        reservationId: true,
                        amount: true,
                        status: true,
                        mPesaReceiptNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                driver: false, // Explicitly exclude driver
                owner: false, // Explicitly exclude owner
                organization: false, // Explicitly exclude organization
                geofences: false, // Explicitly exclude geofences
            },
        })) as UserWithRelations[];

        const total = await db.user.count({
            where: { clerkId, role: ROLES.PASSENGER },
        });

        const formattedUsers = users.map(mapUserWithRelationsToUser);

        return { users: formattedUsers, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getUserRecords error: ${errorMsg}`);
        throw new Error(`Failed to fetch users: ${errorMsg}`);
    }
}

// Fetch a single passenger user by clerkId
export async function getUserById(clerkId: string): Promise<User> {
    try {
        const user = (await db.user.findUnique({
            where: { clerkId, role: ROLES.PASSENGER },
            include: {
                passenger: { select: { id: true, userId: true, busId: true, createdAt: true, updatedAt: true } },
                reservations: {
                    select: {
                        id: true,
                        tripId: true,
                        seatId: true,
                        status: true,
                        bookedAt: true,
                        updatedAt: true,
                        successfulPaymentId: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                sentMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                receivedMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                payments: {
                    select: {
                        id: true,
                        reservationId: true,
                        amount: true,
                        status: true,
                        mPesaReceiptNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                driver: false,
                owner: false,
                organization: false,
                geofences: false,
            },
        })) as UserWithRelations | null;

        if (!user) {
            throw new Error('Passenger user not found');
        }

        return mapUserWithRelationsToUser(user);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getUserById error: ${errorMsg}`);
        throw new Error(`Failed to fetch user: ${errorMsg}`);
    }
}

// Update a passenger user
export async function updateUser(clerkId: string, input: z.infer<typeof UpdateUserSchema>): Promise<User> {
    try {
        // Validate input
        const validatedInput = UpdateUserSchema.parse(input);

        const user = (await db.user.findUnique({
            where: { clerkId, role: ROLES.PASSENGER },
            include: {
                passenger: { select: { id: true, userId: true, busId: true, createdAt: true, updatedAt: true } },
                reservations: {
                    select: {
                        id: true,
                        tripId: true,
                        seatId: true,
                        status: true,
                        bookedAt: true,
                        updatedAt: true,
                        successfulPaymentId: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                sentMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                receivedMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                payments: {
                    select: {
                        id: true,
                        reservationId: true,
                        amount: true,
                        status: true,
                        mPesaReceiptNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                driver: false,
                owner: false,
                organization: false,
                geofences: false,
            },
        })) as UserWithRelations | null;

        if (!user) {
            throw new Error('Passenger user not found');
        }

        // Check if new email is already taken (if provided and different)
        if (validatedInput.email && validatedInput.email !== user.email) {
            const existingUser = await db.user.findUnique({
                where: { email: validatedInput.email },
            });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
        }

        const updatedUser = (await db.user.update({
            where: { clerkId },
            data: {
                firstName: validatedInput.firstName ?? user.firstName,
                lastName: validatedInput.lastName ?? user.lastName,
                email: validatedInput.email ?? user.email,
                phoneNumber: validatedInput.phoneNumber ?? user.phoneNumber,
                image: validatedInput.image ?? user.image ?? '/default-user.png', // Fallback to ensure string
            },
            include: {
                passenger: { select: { id: true, userId: true, busId: true, createdAt: true, updatedAt: true } },
                reservations: {
                    select: {
                        id: true,
                        tripId: true,
                        seatId: true,
                        status: true,
                        bookedAt: true,
                        updatedAt: true,
                        successfulPaymentId: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                sentMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                receivedMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                payments: {
                    select: {
                        id: true,
                        reservationId: true,
                        amount: true,
                        status: true,
                        mPesaReceiptNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                driver: false,
                owner: false,
                organization: false,
                geofences: false,
            },
        })) as UserWithRelations;

        return mapUserWithRelationsToUser(updatedUser);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`updateUser error: ${errorMsg}`);
        throw new Error(`Failed to update user: ${errorMsg}`);
    }
}

// Delete a passenger user
export async function deleteUser(clerkId: string): Promise<{ id: string }> {
    try {
        const user = (await db.user.findUnique({
            where: { clerkId, role: ROLES.PASSENGER },
            include: {
                passenger: { select: { id: true, userId: true, busId: true, createdAt: true, updatedAt: true } },
                reservations: {
                    select: {
                        id: true,
                        tripId: true,
                        seatId: true,
                        status: true,
                        bookedAt: true,
                        updatedAt: true,
                        successfulPaymentId: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        type: true,
                        message: true,
                        status: true,
                        createdAt: true,
                        sentAt: true,
                        subject: true,
                    },
                },
                sentMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                receivedMessages: {
                    select: { id: true, reservationId: true, tripId: true, content: true, timestamp: true },
                },
                payments: {
                    select: {
                        id: true,
                        reservationId: true,
                        amount: true,
                        status: true,
                        mPesaReceiptNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                driver: false,
                owner: false,
                organization: false,
                geofences: false,
            },
        })) as UserWithRelations | null;

        if (!user) {
            throw new Error('Passenger user not found');
        }

        await db.$transaction([
            // Delete passenger record
            ...(user.passenger ? [db.passenger.delete({ where: { id: user.passenger.id } })] : []),
            // Delete user
            db.user.delete({ where: { clerkId } }),
        ]);

        return { id: user.id };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`deleteUser error: ${errorMsg}`);
        throw new Error(`Failed to delete user: ${errorMsg}`);
    }
}

// Fetch passenger's reservations
export async function getPassengerReservations(clerkId: string): Promise<any[]> {
    try {
        const user = (await db.user.findUnique({
            where: { clerkId, role: ROLES.PASSENGER },
            include: {
                reservations: {
                    include: {
                        trip: {
                            include: {
                                bus: true,
                                route: true,
                            },
                        },
                    },
                },
            },
        })) as UserWithRelations | null;

        if (!user) {
            throw new Error('Passenger user not found');
        }

        return user.reservations;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getPassengerReservations error: ${errorMsg}`);
        throw new Error(`Failed to fetch reservations: ${errorMsg}`);
    }
}

// Fetch passenger's payment history
export async function getPassengerPayments(clerkId: string): Promise<any[]> {
    try {
        const user = (await db.user.findUnique({
            where: { clerkId, role: ROLES.PASSENGER },
            include: {
                payments: {
                    include: {
                        reservation: {
                            include: {
                                trip: true,
                            },
                        },
                    },
                },
            },
        })) as UserWithRelations | null;

        if (!user) {
            throw new Error('Passenger user not found');
        }

        return user.payments;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getPassengerPayments error: ${errorMsg}`);
        throw new Error(`Failed to fetch payments: ${errorMsg}`);
    }
}
