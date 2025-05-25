'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    createReminder,
    updateReminder,
    markReminderAsRead,
    getReminders,
    getReminderById,
    deleteReminder,
} from '@/lib/dbReminder';
import { Reminder } from '@/lib/prisma/dbtypes';

// Validation Schemas
const reminderInputSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
    busId: z.number().positive('Bus ID must be a positive number'),
    date: z.string().refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date' }),
    maintenanceType: z.string().max(50, 'Maintenance type must be 50 characters or less').optional(),
    isMaintenance: z.boolean(),
});

const updateReminderSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    message: z.string().min(1, 'Message is required').max(500).optional(),
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    date: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date' })
        .optional(),
    maintenanceType: z.string().max(50).optional().nullable(),
    isMaintenance: z.boolean().optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number').optional(),
    isread: z.boolean().optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Create a reminder
export async function createReminderAction(formData: FormData): Promise<Reminder> {
    try {
        const clerkId = await getClerkId();
        const data = {
            title: formData.get('title') as string,
            message: formData.get('message') as string,
            busId: Number(formData.get('busId')),
            date: formData.get('date') as string,
            maintenanceType: formData.get('maintenanceType') as string | undefined,
            isMaintenance: formData.get('isMaintenance') === 'true',
        };

        const validatedData = reminderInputSchema.parse(data);
        const reminder = await createReminder(clerkId, {
            ...validatedData,
            date: new Date(validatedData.date),
        });

        revalidatePath('/reminders');
        return reminder;
    } catch (error) {
        console.error('createReminderAction error:', error);
        throw new Error('Failed to create reminder');
    }
}

// Update a reminder
export async function updateReminderAction(reminderId: number, formData: FormData): Promise<Reminder> {
    try {
        const clerkId = await getClerkId();
        const data = {
            title: formData.get('title') as string | undefined,
            message: formData.get('message') as string | undefined,
            busId: formData.get('busId') ? Number(formData.get('busId')) : undefined,
            date: formData.get('date') as string | undefined,
            maintenanceType: formData.get('maintenanceType') as string | undefined,
            isMaintenance: formData.get('isMaintenance') ? formData.get('isMaintenance') === 'true' : undefined,
        };

        const validatedData = updateReminderSchema.parse(data);
        const reminder = await updateReminder(clerkId, reminderId, {
            ...validatedData,
            date: validatedData.date ? new Date(validatedData.date) : undefined,
        });

        revalidatePath(`/reminders/${reminderId}`);
        return reminder;
    } catch (error) {
        console.error('updateReminderAction error:', error);
        throw new Error('Failed to update reminder');
    }
}

// Mark a reminder as read
export async function markReminderAsReadAction(reminderId: number): Promise<Reminder> {
    try {
        const clerkId = await getClerkId();
        const reminder = await markReminderAsRead(clerkId, reminderId);

        revalidatePath(`/reminders/${reminderId}`);
        return reminder;
    } catch (error) {
        console.error('markReminderAsReadAction error:', error);
        throw new Error('Failed to mark reminder as read');
    }
}

// Get reminders with pagination and filters
export async function getRemindersAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { busId?: number; isread?: boolean };
}): Promise<{ reminders: Reminder[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getReminders({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getRemindersAction error:', error);
        throw new Error('Failed to fetch reminders');
    }
}

// Get a reminder by ID
export async function getReminderByIdAction({ ownerId, id }: { ownerId: number; id: number }): Promise<Reminder> {
    try {
        return await getReminderById({ ownerId, id });
    } catch (error) {
        console.error('getReminderByIdAction error:', error);
        throw new Error('Failed to fetch reminder');
    }
}

// Delete a reminder
export async function deleteReminderAction(reminderId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteReminder(clerkId, reminderId);

        revalidatePath('/reminders');
        redirect('/reminders');
    } catch (error) {
        console.error('deleteReminderAction error:', error);
        throw new Error('Failed to delete reminder');
    }
}
