'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    getNotifications,
    getDriverNotifications,
    notifyDriverArrival,
    notifyDriverOffline,
    notifyDriverInTransit,
    updateNotification,
    deleteNotification,
} from '@/lib/dbNotifications';
import { Notification } from '@/lib/prisma/dbtypes';

// Validation Schemas
const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    type: z.string().optional(),
    status: z.string().optional(),
});

const notificationInputSchema = z.object({
    destination: z.string().min(2).max(100).optional(),
    message: z.string().max(500).optional(),
});

const updateNotificationSchema = z.object({
    message: z.string().max(500).optional(),
    status: z.enum(['pending', 'sent', 'read']).optional(),
    subject: z.string().max(100).optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Get notifications for an owner
export async function getNotificationsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getNotifications({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getNotificationsAction error:', error);
        throw new Error('Failed to fetch notifications');
    }
}

// Get notifications for a driver
export async function getDriverNotificationsAction({
    driverId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    driverId: number;
    page?: number;
    pageSize?: number;
    filters?: { type?: string; status?: string };
}): Promise<{ notifications: Notification[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getDriverNotifications({
            driverId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getDriverNotificationsAction error:', error);
        throw new Error('Failed to fetch driver notifications');
    }
}

// Notify driver arrival
export async function notifyDriverArrivalAction(formData: FormData): Promise<Notification> {
    try {
        const clerkId = await getClerkId();
        const data = {
            destination: formData.get('destination') as string | undefined,
            message: formData.get('message') as string | undefined,
        };

        const validatedData = notificationInputSchema.parse(data);
        const notification = await notifyDriverArrival(clerkId, validatedData.destination || '', validatedData.message);

        revalidatePath('/notifications');
        return notification;
    } catch (error) {
        console.error('notifyDriverArrivalAction error:', error);
        throw new Error('Failed to send driver arrival notification');
    }
}

// Notify driver offline
export async function notifyDriverOfflineAction(formData: FormData): Promise<Notification> {
    try {
        const clerkId = await getClerkId();
        const data = {
            message: formData.get('message') as string | undefined,
        };

        const validatedData = notificationInputSchema.parse(data);
        const notification = await notifyDriverOffline(clerkId, validatedData.message);

        revalidatePath('/notifications');
        return notification;
    } catch (error) {
        console.error('notifyDriverOfflineAction error:', error);
        throw new Error('Failed to send driver offline notification');
    }
}

// Notify driver in transit
export async function notifyDriverInTransitAction(formData: FormData): Promise<Notification> {
    try {
        const clerkId = await getClerkId();
        const data = {
            message: formData.get('message') as string | undefined,
        };

        const validatedData = notificationInputSchema.parse(data);
        const notification = await notifyDriverInTransit(clerkId, validatedData.message);

        revalidatePath('/notifications');
        return notification;
    } catch (error) {
        console.error('notifyDriverInTransitAction error:', error);
        throw new Error('Failed to send driver in-transit notification');
    }
}

// Update a notification
export async function updateNotificationAction(notificationId: number, formData: FormData): Promise<Notification> {
    try {
        const clerkId = await getClerkId();
        const data = {
            message: formData.get('message') as string | undefined,
            status: formData.get('status') as 'pending' | 'sent' | 'read' | undefined,
            subject: formData.get('subject') as string | undefined,
        };

        const validatedData = updateNotificationSchema.parse(data);
        const notification = await updateNotification(clerkId, notificationId, validatedData);

        revalidatePath(`/notifications/${notificationId}`);
        return notification;
    } catch (error) {
        console.error('updateNotificationAction error:', error);
        throw new Error('Failed to update notification');
    }
}

// Delete a notification
export async function deleteNotificationAction(notificationId: number): Promise<void> {
    try {
        const clerkId = await getClerkId();
        await deleteNotification(clerkId, notificationId);

        revalidatePath('/notifications');
    } catch (error) {
        console.error('deleteNotificationAction error:', error);
        throw new Error('Failed to delete notification');
    }
}
