'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createOwner, getOwnerById, getOwners, updateOwner, deleteOwner } from '@/lib/dbOwner';
import { Owner } from '@/lib/prisma/dbtypes';

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

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create an owner
export async function createOwnerAction(formData: FormData): Promise<Owner> {
    try {
        const authenticatedClerkId = await getClerkId();
        const data = {
            clerkId: formData.get('clerkId') as string,
        };

        const validatedData = createOwnerSchema.parse(data);
        const owner = await createOwner({ ...validatedData, authenticatedClerkId });

        revalidatePath('/owners');
        return owner;
    } catch (error) {
        console.error('createOwnerAction error:', error);
        throw new Error('Failed to create owner');
    }
}

// Get an owner by ID
export async function getOwnerByIdAction(ownerId: number): Promise<Owner> {
    try {
        return await getOwnerById(ownerId);
    } catch (error) {
        console.error('getOwnerByIdAction error:', error);
        throw new Error('Failed to fetch owner');
    }
}

// Get multiple owners with pagination and filters
export async function getOwnersAction({
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    page?: number;
    pageSize?: number;
    filters?: { name?: string; email?: string };
}): Promise<{ owners: Owner[]; total: number }> {
    try {
        const authenticatedClerkId = await getClerkId();
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getOwners({
            authenticatedClerkId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getOwnersAction error:', error);
        throw new Error('Failed to fetch owners');
    }
}

// Update an owner
export async function updateOwnerAction(ownerId: number, formData: FormData): Promise<Owner> {
    try {
        const authenticatedClerkId = await getClerkId();
        const data = {
            name: formData.get('name') as string | undefined,
            email: formData.get('email') as string | undefined,
            phoneNumber: formData.get('phoneNumber') as string | undefined,
        };

        const validatedData = updateOwnerSchema.parse(data);
        const owner = await updateOwner(authenticatedClerkId, ownerId, validatedData);

        revalidatePath(`/owners/${ownerId}`);
        return owner;
    } catch (error) {
        console.error('updateOwnerAction error:', error);
        throw new Error('Failed to update owner');
    }
}

// Delete an owner
export async function deleteOwnerAction(ownerId: number): Promise<void> {
    try {
        const authenticatedClerkId = await getClerkId();
        await deleteOwner(authenticatedClerkId, ownerId);

        revalidatePath('/owners');
        redirect('/owners');
    } catch (error) {
        console.error('deleteOwnerAction error:', error);
        throw new Error('Failed to delete owner');
    }
}
