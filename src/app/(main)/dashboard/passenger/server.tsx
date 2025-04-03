// src/app/dashboard/passenger/server.tsx
// No 'use client' - this is a server component

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import PassengerDashboardClient from './client'; // Client component for rendering

// Fetch passenger data server-side
async function getPassengerData(clerkId: string) {
    const passenger = await prisma.user.findUnique({
        where: { clerkId },
        include: {
            reservations: {
                where: { status: 'confirmed' },
                include: { trip: { include: { bus: true } } },
                orderBy: { bookedAt: 'desc' },
            },
        },
    });

    if (!passenger || passenger.role !== 'PASSENGER') {
        throw new Error('User is not a passenger');
    }

    const buses = await prisma.bus.findMany({
        where: { trips: { some: { status: 'scheduled' } } },
        take: 10,
    });

    return { passenger, buses };
}

export default async function PassengerDashboardServer() {
    const user = await currentUser();
    if (!user) {
        return {
            props: { user: null, passenger: null, buses: [] },
            error: 'Please sign in to access the passenger dashboard.',
        };
    }

    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return {
            props: { user, passenger, buses },
            error: null,
        };
    } catch (error) {
        return {
            props: { user, passenger: null, buses: [] },
            error: error instanceof Error ? error.message : 'Failed to load passenger data',
        };
    }
}

// Export as the default page
export async function Page() {
    const { props, error } = await PassengerDashboardServer();
    return <PassengerDashboardClient {...props} error={error} />;
}
