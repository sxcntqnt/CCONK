'use server';

import { db } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { ReminderWithRelations } from './dbTypes';
import { z } from 'zod';

// Use Role enum from @prisma/client
const ROLES = { DRIVER: Role.DRIVER, OWNER: Role.OWNER };

// Validation Schemas
const reminderInputSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    message: z.string().min(1, 'Message is required').max(500, 'Message must be 500 characters or less'),
    busId: z.string().uuid('Bus ID must be a valid UUID'),
    date: z.date().min(new Date(), 'Date must be in the future'),
    maintenanceType: z.string().max(50, 'Maintenance type must be 50 characters or less').optional(),
    isMaintenance: z.boolean(),
});

const updateReminderSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    message: z.string().min(1, 'Message is required').max(500).optional(),
    busId: z.string().uuid('Bus ID must be a valid UUID').optional(),
    date: z.date().min(new Date(), 'Date must be in the future').optional(),
    maintenanceType: z.string().max(50).optional().nullable(),
    isMaintenance: z.boolean().optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    busId: z.string().uuid('Bus ID must be a valid UUID').optional(),
    isRead: z.boolean().optional(),
});

// Custom Error
class ReminderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReminderError';
    }
}

// Define type for Prisma query result
type ReminderWithBus = Prisma.ReminderGetPayload<{
    include: { bus: { select: { id: true; licensePlate: true } } };
}>;

// Helper function to format Reminder data
function formatReminder(reminder: ReminderWithBus): ReminderWithRelations {
    return {
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        busId: reminder.busId,
        date: reminder.date,
        maintenanceType: reminder.maintenanceType ?? null,
        isMaintenance: reminder.isMaintenance,
        isRead: reminder.isRead,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt,
        bus: {
            id: reminder.bus.id,
            licensePlate: reminder.bus.licensePlate,
        },
    };
}

// Create Reminder
export async function createReminder(
    clerkId: string,
    {
        title,
        message,
        busId,
        date,
        maintenanceType,
        isMaintenance,
    }: {
        title: string;
        message: string;
        busId: string;
        date: Date;
        maintenanceType?: string;
        isMaintenance: boolean;
    },
): Promise<ReminderWithRelations> {
    try {
        // Validate inputs
        const validatedData = reminderInputSchema.parse({
            title,
            message,
            busId,
            date,
            maintenanceType,
            isMaintenance,
        });

        // Verify user is an OWNER and owns the bus
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: { include: { buses: { select: { id: true } } } } },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new ReminderError('User is not authorized to create reminders');
        }

        const busIds = user.owner.buses.map((bus) => bus.id);
        if (!busIds.includes(validatedData.busId)) {
            throw new ReminderError('User does not own the specified bus');
        }

        // Create reminder
        const reminder = await db.reminder.create({
            data: {
                title: validatedData.title,
                message: validatedData.message,
                busId: validatedData.busId,
                date: validatedData.date,
                maintenanceType: validatedData.maintenanceType,
                isMaintenance: validatedData.isMaintenance,
                isRead: false,
            },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                    },
                },
            },
        });

        return formatReminder(reminder);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`createReminder error: ${errorMsg}`);
        throw new ReminderError(`Failed to create reminder: ${errorMsg}`);
    }
}

// Update Reminder
export async function updateReminder(
    clerkId: string,
    reminderId: string,
    {
        title,
        message,
        busId,
        date,
        maintenanceType,
        isMaintenance,
    }: {
        title?: string;
        message?: string;
        busId?: string;
        date?: Date;
        maintenanceType?: string | null;
        isMaintenance?: boolean;
    },
): Promise<ReminderWithRelations> {
    try {
        // Validate inputs
        const validatedData = updateReminderSchema.parse({
            title,
            message,
            busId,
            date,
            maintenanceType,
            isMaintenance,
        });

        // Verify user is an OWNER and owns the bus
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: { include: { buses: { select: { id: true } } } } },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new ReminderError('User is not authorized to update reminders');
        }

        // Fetch reminder to verify ownership
        const reminder = await db.reminder.findUnique({
            where: { id: reminderId },
            include: { bus: { select: { ownerId: true } } },
        });
        if (!reminder) {
            throw new ReminderError('Reminder not found');
        }
        if (reminder.bus.ownerId !== user.owner.id) {
            throw new ReminderError('User does not own the bus associated with this reminder');
        }

        // If updating busId, verify ownership
        if (validatedData.busId && !user.owner.buses.map((bus) => bus.id).includes(validatedData.busId)) {
            throw new ReminderError('User does not own the specified bus');
        }

        // Update reminder
        const updatedReminder = await db.reminder.update({
            where: { id: reminderId },
            data: {
                title: validatedData.title ?? undefined,
                message: validatedData.message ?? undefined,
                busId: validatedData.busId ?? undefined,
                date: validatedData.date ?? undefined,
                maintenanceType: validatedData.maintenanceType ?? undefined,
                isMaintenance: validatedData.isMaintenance ?? undefined,
            },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                    },
                },
            },
        });

        return formatReminder(updatedReminder);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`updateReminder error: ${errorMsg}`);
        throw new ReminderError(`Failed to update reminder: ${errorMsg}`);
    }
}

// Mark Reminder as Read
export async function markReminderAsRead(clerkId: string, reminderId: string): Promise<ReminderWithRelations> {
    try {
        // Verify user is an OWNER
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new ReminderError('User is not authorized to mark reminders as read');
        }

        // Fetch reminder to verify ownership
        const reminder = await db.reminder.findUnique({
            where: { id: reminderId },
            include: { bus: { select: { ownerId: true } } },
        });
        if (!reminder) {
            throw new ReminderError('Reminder not found');
        }
        if (reminder.bus.ownerId !== user.owner.id) {
            throw new ReminderError('User does not own the bus associated with this reminder');
        }

        // Update isRead status
        const updatedReminder = await db.reminder.update({
            where: { id: reminderId },
            data: { isRead: true },
            include: {
                bus: {
                    select: {
                        id: true,
                        licensePlate: true,
                    },
                },
            },
        });

        return formatReminder(updatedReminder);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`markReminderAsRead error: ${errorMsg}`);
        throw new ReminderError(`Failed to mark reminder as read: ${errorMsg}`);
    }
}

// Read Reminders
export async function getReminders({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { busId?: string; isRead?: boolean };
}): Promise<{ reminders: ReminderWithRelations[]; total: number }> {
    try {
        // Validate inputs
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const where = {
            bus: { ownerId },
            ...(validatedFilters.busId && { busId: validatedFilters.busId }),
            ...(validatedFilters.isRead !== undefined && { isRead: validatedFilters.isRead }),
        };

        const [reminders, total] = await Promise.all([
            db.reminder.findMany({
                where,
                include: {
                    bus: { select: { id: true, licensePlate: true } },
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { date: 'desc' },
            }),
            db.reminder.count({ where }),
        ]);

        const formattedReminders: ReminderWithRelations[] = reminders.map(formatReminder);

        return { reminders: formattedReminders, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getReminders error: ${errorMsg}`);
        throw new ReminderError(`Failed to fetch reminders: ${errorMsg}`);
    }
}

// Read Reminder by ID
export async function getReminderById({
    ownerId,
    id,
}: {
    ownerId: string;
    id: string;
}): Promise<ReminderWithRelations> {
    try {
        const reminder = await db.reminder.findFirst({
            where: {
                id,
                bus: { ownerId },
            },
            include: {
                bus: { select: { id: true, licensePlate: true } },
            },
        });

        if (!reminder) {
            throw new ReminderError('Reminder not found');
        }

        return formatReminder(reminder);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getReminderById error: ${errorMsg}`);
        throw new ReminderError(`Failed to fetch reminder: ${errorMsg}`);
    }
}

// Delete Reminder
export async function deleteReminder(clerkId: string, reminderId: string): Promise<void> {
    try {
        // Verify user is an OWNER
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });

        if (!user || user.role !== ROLES.OWNER || !user.owner) {
            throw new ReminderError('User is not authorized to delete reminders');
        }

        // Fetch reminder to verify ownership
        const reminder = await db.reminder.findUnique({
            where: { id: reminderId },
            include: { bus: { select: { ownerId: true } } },
        });
        if (!reminder) {
            throw new ReminderError('Reminder not found');
        }
        if (reminder.bus.ownerId !== user.owner.id) {
            throw new ReminderError('User does not own the bus associated with this reminder');
        }

        // Delete reminder
        await db.reminder.delete({
            where: { id: reminderId },
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`deleteReminder error: ${errorMsg}`);
        throw new ReminderError(`Failed to delete reminder: ${errorMsg}`);
    }
}
