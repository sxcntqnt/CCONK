// src/lib/prisma/dbOrg.ts
'use server';

import { db } from '@/lib/prisma';
import { Organization, ROLES, Role } from '@/utils';
import { z } from 'zod';
import { OrganizationWithRelations } from './dbTypes';

// Utility function to map OrganizationWithRelations to Organization with user details
function mapOrganizationWithRelationsToOrganization(org: OrganizationWithRelations): Organization & {
    email: string;
    firstName: string;
    lastName: string;
    image: string;
} {
    return {
        id: org.id,
        userId: org.userId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        user: {
            id: org.user.id,
            firstName: org.user.firstName,
            lastName: org.user.lastName,
            email: org.user.email,
            image: org.user.image ?? '/default-user.png',
            role: org.user.role,
            phoneNumber: org.user.phoneNumber ?? undefined,
            createdAt: org.createdAt, // Placeholder, adjust if User has createdAt
            updatedAt: org.updatedAt, // Placeholder, adjust if User has updatedAt
        },
        buses: org.buses,
        owners: org.owners,
        notifications: org.notifications,
        sentMessages: org.sentMessages,
        receivedMessages: org.receivedMessages,
        email: org.user.email,
        firstName: org.user.firstName,
        lastName: org.user.lastName,
        image: org.user.image ?? '/default-user.png',
    };
}

// Zod schemas for input validation
const CreateOrganizationSchema = z.object({
    clerkId: z.string().min(1, 'Clerk ID is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().optional().nullable(),
    image: z.string().optional(),
});

const UpdateOrganizationSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    phoneNumber: z.string().optional().nullable(),
    image: z.string().optional(),
});

// Create a new organization
export async function createOrganization(
    input: z.infer<typeof CreateOrganizationSchema>,
): Promise<Organization & { email: string; firstName: string; lastName: string; image: string }> {
    try {
        // Validate input
        const validatedInput = CreateOrganizationSchema.parse(input);

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
                role: ROLES.ORGANIZATION,
            },
        });

        // Create organization record
        const newOrganization = await db.organization.create({
            data: { userId: user.id },
        });

        return mapOrganizationWithRelationsToOrganization({
            ...newOrganization,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                image: user.image,
                role: user.role,
                phoneNumber: user.phoneNumber,
            },
            buses: [],
            owners: [],
            notifications: [],
            sentMessages: [],
            receivedMessages: [],
        });
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`createOrganization error: ${errorMsg}`);
        throw new Error(`Failed to create organization: ${errorMsg}`);
    }
}

// Fetch multiple organization records
export async function getOrganizationRecords({
    clerkId,
    page = 1,
    pageSize = 10,
}: {
    clerkId: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    organizations: (Organization & { email: string; firstName: string; lastName: string; image: string })[];
    total: number;
}> {
    try {
        const skip = (page - 1) * pageSize;
        if (!Number.isFinite(skip) || skip < 0) {
            throw new Error(`Invalid pagination: page=${page}, pageSize=${pageSize}, skip=${skip}`);
        }

        const organizations = (await db.organization.findMany({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
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
                    },
                },
                owners: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
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
            },
        })) as OrganizationWithRelations[];

        const total = await db.organization.count({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
        });

        const formattedOrganizations = organizations.map(mapOrganizationWithRelationsToOrganization);

        return { organizations: formattedOrganizations, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOrganizationRecords error: ${errorMsg}`);
        throw new Error(`Failed to fetch organizations: ${errorMsg}`);
    }
}

// Fetch a single organization by clerkId
export async function getOrganizationById(clerkId: string): Promise<
    Organization & {
        email: string;
        firstName: string;
        lastName: string;
        image: string;
    }
> {
    try {
        const organization = (await db.organization.findFirst({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
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
                    },
                },
                owners: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
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
            },
        })) as OrganizationWithRelations | null;

        if (!organization) {
            throw new Error('Organization not found');
        }

        return mapOrganizationWithRelationsToOrganization(organization);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOrganizationById error: ${errorMsg}`);
        throw new Error(`Failed to fetch organization: ${errorMsg}`);
    }
}

// Update an organization
export async function updateOrganization(
    clerkId: string,
    input: z.infer<typeof UpdateOrganizationSchema>,
): Promise<Organization & { email: string; firstName: string; lastName: string; image: string }> {
    try {
        // Validate input
        const validatedInput = UpdateOrganizationSchema.parse(input);

        const organization = (await db.organization.findFirst({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
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
                    },
                },
                owners: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
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
            },
        })) as OrganizationWithRelations | null;

        if (!organization) {
            throw new Error('Organization not found');
        }

        // Check if new email is already taken (if provided and different)
        if (validatedInput.email && validatedInput.email !== organization.user.email) {
            const existingUser = await db.user.findUnique({
                where: { email: validatedInput.email },
            });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
        }

        const updatedUser = await db.user.update({
            where: { clerkId },
            data: {
                firstName: validatedInput.firstName ?? organization.user.firstName,
                lastName: validatedInput.lastName ?? organization.user.lastName,
                email: validatedInput.email ?? organization.user.email,
                phoneNumber: validatedInput.phoneNumber ?? organization.user.phoneNumber,
                image: validatedInput.image ?? organization.user.image ?? '/default-user.png',
            },
        });

        const updatedOrganization = (await db.organization.findFirst({
            where: { user: { clerkId } },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
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
                    },
                },
                owners: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
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
            },
        })) as OrganizationWithRelations;

        return mapOrganizationWithRelationsToOrganization(updatedOrganization);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`updateOrganization error: ${errorMsg}`);
        throw new Error(`Failed to update organization: ${errorMsg}`);
    }
}

// Delete an organization
export async function deleteOrganization(clerkId: string): Promise<{ id: string }> {
    try {
        const organization = (await db.organization.findFirst({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        image: true,
                        role: true,
                        phoneNumber: true,
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
                    },
                },
                owners: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
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
            },
        })) as OrganizationWithRelations | null;

        if (!organization) {
            throw new Error('Organization not found');
        }

        await db.$transaction([
            // Delete organization record
            db.organization.delete({ where: { id: organization.id } }),
            // Delete associated user
            db.user.delete({ where: { clerkId } }),
        ]);

        return { id: organization.id };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`deleteOrganization error: ${errorMsg}`);
        throw new Error(`Failed to delete organization: ${errorMsg}`);
    }
}

// Fetch organization's buses
export async function getOrganizationBuses(clerkId: string): Promise<any[]> {
    try {
        const organization = (await db.organization.findFirst({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            include: {
                buses: {
                    include: {
                        images: true,
                        seats: true,
                        trips: true,
                    },
                },
            },
        })) as OrganizationWithRelations | null;

        if (!organization) {
            throw new Error('Organization not found');
        }

        return organization.buses;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOrganizationBuses error: ${errorMsg}`);
        throw new Error(`Failed to fetch buses: ${errorMsg}`);
    }
}

// Fetch organization's owners
export async function getOrganizationOwners(clerkId: string): Promise<any[]> {
    try {
        const organization = (await db.organization.findFirst({
            where: { user: { clerkId, role: ROLES.ORGANIZATION } },
            include: {
                owners: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                image: true,
                                role: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
            },
        })) as OrganizationWithRelations | null;

        if (!organization) {
            throw new Error('Organization not found');
        }

        return organization.owners;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getOrganizationOwners error: ${errorMsg}`);
        throw new Error(`Failed to fetch owners: ${errorMsg}`);
    }
}
