// src/app/(main)/dashboard/passenger/server.tsx
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PassengerDashboardClient from './client';

interface DashboardProps {
    user: any | null; // Use Clerk's User type if possible
    passenger: any | null; // Use Prisma type from client.tsx
    buses: any[]; // Use Prisma Bus type
    error: string | null;
}

async function getPassengerData(clerkId: string) {
    const passenger = await db.user.findUnique({
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

    const buses = await db.bus.findMany({
        where: { trips: { some: { status: 'scheduled' } } },
        take: 10,
    });

    return { passenger, buses };
}

async function PassengerDashboardServer(): Promise<{ props: DashboardProps; error: string | null }> {
    let user;
    try {
        user = await currentUser();
    } catch (error) {
        console.error('Server - Error fetching currentUser:', error);
        return {
            props: {
                user: null,
                passenger: null,
                buses: [],
                error: 'Authentication failed. Please sign in again.',
            },
            error: 'Authentication failed. Please sign in again.',
        };
    }

    if (!user) {
        return {
            props: {
                user: null,
                passenger: null,
                buses: [],
                error: 'Please sign in to access the passenger dashboard.',
            },
            error: 'Please sign in to access the passenger dashboard.',
        };
    }

    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return {
            props: {
                user,
                passenger,
                buses,
                error: null,
            },
            error: null,
        };
    } catch (error) {
        console.error('Server - Error fetching passenger data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load passenger data';
        return {
            props: {
                user,
                passenger: null,
                buses: [],
                error: errorMessage,
            },
            error: errorMessage,
        };
    }
}

export async function Page() {
    const { props, error } = await PassengerDashboardServer();
    if (error === 'User is not a passenger') {
        redirect('/dashboard'); // Redirect to role selector if not a passenger
    }
    return <PassengerDashboardClient {...props} />;
}
