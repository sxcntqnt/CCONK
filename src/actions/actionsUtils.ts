'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ensureBusHasTrip, ensureDriverHasTrip, ensureBusExists, cleanupBusData } from '@/lib/dbUtils';

// Validation Schemas
const busIdSchema = z.object({
    busId: z.number().positive('Bus ID must be a positive number'),
});

const driverIdSchema = z.object({
    driverId: z.number().positive('Driver ID must be a positive number'),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Ensure bus has a trip
export async function ensureBusHasTripAction(formData: FormData): Promise<void> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: Number(formData.get('busId')),
        };

        const validatedData = busIdSchema.parse(data);

        // Verify user authorization (Owner or Admin)
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            throw new Error('User is not authorized to ensure bus has trip');
        }

        if (user.role === 'OWNER') {
            const bus = await db.bus.findUnique({
                where: { id: validatedData.busId },
                select: { ownerId: true },
            });
            if (!bus || bus.ownerId !== user.owner?.id) {
                throw new Error('User does not own this bus');
            }
        }

        await ensureBusHasTrip(validatedData.busId);

        revalidatePath(`/buses/${data.busId}/trips`);
    } catch (error) {
        console.error('ensureBusHasTripAction error:', error);
        throw new Error('Failed to ensure bus has trip');
    }
}

// Ensure driver has a trip
export async function ensureDriverHasTripAction(formData: FormData): Promise<void> {
    try {
        const clerkId = await getClerkId();
        const data = {
            driverId: Number(formData.get('driverId')),
        };

        const validatedData = driverIdSchema.parse(data);

        // Verify user authorization (Driver or Admin)
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { driver: true },
        });
        if (!user || (user.role !== 'DRIVER' && user.role !== 'ADMIN')) {
            throw new Error('User is not authorized to ensure driver has trip');
        }

        if (user.role === 'DRIVER' && user.driver?.id !== validatedData.driverId) {
            throw new Error('User is not authorized for this driver');
        }

        await ensureDriverHasTrip(validatedData.driverId);

        revalidatePath(`/drivers/${data.driverId}/trips`);
    } catch (error) {
        console.error('ensureDriverHasTripAction error:', error);
        throw new Error('Failed to ensure driver has trip');
    }
}

// Ensure buses exist
export async function ensureBusExistsAction(): Promise<void> {
    try {
        const clerkId = await getClerkId();

        // Verify user authorization (Admin only)
        const user = await db.user.findUnique({
            where: { clerkId },
        });
        if (!user || user.role !== 'ADMIN') {
            throw new Error('User is not authorized to ensure buses exist');
        }

        await ensureBusExists();

        revalidatePath('/buses');
    } catch (error) {
        console.error('ensureBusExistsAction error:', error);
        throw new Error('Failed to ensure buses exist');
    }
}

// Clean up bus data
export async function cleanupBusDataAction(formData: FormData): Promise<void> {
    try {
        const clerkId = await getClerkId();
        const data = {
            busId: Number(formData.get('busId')),
        };

        const validatedData = busIdSchema.parse(data);

        // Verify user authorization (Owner or Admin)
        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            throw new Error('User is not authorized to clean up bus data');
        }

        if (user.role === 'OWNER') {
            const bus = await db.bus.findUnique({
                where: { id: validatedData.busId },
                select: { ownerId: true },
            });
            if (!bus || bus.ownerId !== user.owner?.id) {
                throw new Error('User does not own this bus');
            }
        }

        await cleanupBusData(validatedData.busId);

        revalidatePath(`/buses/${data.busId}`);
    } catch (error) {
        console.error('cleanupBusDataAction error:', error);
        throw new Error('Failed to clean up bus data');
    }
}
