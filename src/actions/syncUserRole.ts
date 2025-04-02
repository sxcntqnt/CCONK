// src/actions/syncUserRole.ts
'use server';

import { prisma } from '@/lib/prisma'; // Adjust path to your Prisma client

export async function syncUserRole(
    clerkId: string,
    email: string,
    role: 'PASSENGER' | 'DRIVER' | 'OWNER',
    name?: string,
) {
    try {
        await prisma.user.upsert({
            where: { clerkId },
            update: { role },
            create: {
                clerkId,
                email,
                role,
                name: name || '', // Default to empty string if no name
            },
        });
    } catch (error) {
        console.error('Failed to sync user role:', error);
        throw new Error('Unable to sync user role to database');
    }
}
