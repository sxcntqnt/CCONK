'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createuser, getuserRecords, getuserById, updateuser, deleteuser } from '@/lib/dbuser';
import { user } from '@/lib/prisma/dbtypes';

// Validation Schemas
const createuserSchema = z.object({
    nickname: z.string().min(1, 'Nickname is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
});

const updateuserSchema = z.object({
    nickname: z.string().min(1, 'Nickname is required').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    id: z.number().positive('ID must be a positive number').optional(),
    nickname: z.string().optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create a user
export async function createuserAction(formData: FormData): Promise<user> {
    try {
        const clerkId = await getClerkId();
        const data = {
            nickname: formData.get('nickname') as string,
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string | undefined,
            phone: formData.get('phone') as string | undefined,
        };

        const validatedData = createuserSchema.parse(data);
        const user = await createuser(clerkId, validatedData);

        revalidatePath('/users');
        return user;
    } catch (error) {
        console.error('createuserAction error:', error);
        throw new Error('Failed to create user');
    }
}

// Get user records
export async function getuserRecordsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { id?: number; nickname?: string };
}): Promise<{ users: user[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getuserRecords({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getuserRecordsAction error:', error);
        throw new Error('Failed to fetch users');
    }
}

// Get user by ID
export async function getuserByIdAction(userId: number): Promise<user> {
    try {
        const clerkId = await getClerkId();
        return await getuserById(clerkId, userId);
    } catch (error) {
        console.error('getuserByIdAction error:', error);
        throw new Error('Failed to fetch user');
    }
}

// Update a user
export async function updateuserAction(userId: number, formData: FormData): Promise<user> {
    try {
        const clerkId = await getClerkId();
        const data = {
            nickname: formData.get('nickname') as string | undefined,
            firstName: formData.get('firstName') as string | undefined,
            lastName: formData.get('lastName') as string | undefined,
            email: formData.get('email') as string | undefined,
            phone: formData.get('phone') as string | undefined,
        };

        const validatedData = updateuserSchema.parse(data);
        const user = await updateuser(clerkId, userId, validatedData);

        revalidatePath(`/users/${userId}`);
        return user;
    } catch (error) {
        console.error('updateuserAction error:', error);
        throw new Error('Failed to update user');
    }
}

// Delete a user
export async function deleteuserAction(userId: number): Promise<{ id: number }> {
    try {
        const clerkId = await getClerkId();
        const result = await deleteuser(clerkId, userId);

        revalidatePath('/users');
        return result;
    } catch (error) {
        console.error('deleteuserAction error:', error);
        throw new Error('Failed to delete user');
    }
}
