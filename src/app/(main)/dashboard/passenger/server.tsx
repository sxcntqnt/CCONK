// src/app/(main)/dashboard/passenger/server.tsx
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PassengerDashboardClient from './client';
import { Role } from '@/utils/constants/roles';
import { Prisma } from '@prisma/client';

type Passenger = Prisma.UserGetPayload<{
    include: {
        reservations: {
            include: { trip: { include: { bus: true } } };
        };
    };
}>;

type Bus = Prisma.BusGetPayload<{}>;

interface UserData {
    id: string; // Add Clerk user ID
    firstName: string | null;
}

interface DashboardProps {
    userData: UserData | null;
    passenger: Passenger | null;
    buses: Bus[];
    error: string | null;
    role: Role;
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
                userData: null,
                passenger: null,
                buses: [],
                error: 'Authentication failed. Please sign in again.',
                role: 'PASSENGER',
            },
            error: 'Authentication failed. Please sign in again.',
        };
    }

    if (!user) {
        return {
            props: {
                userData: null,
                passenger: null,
                buses: [],
                error: 'Please sign in to access the passenger dashboard.',
                role: 'PASSENGER',
            },
            error: 'Please sign in to access the passenger dashboard.',
        };
    }

    const role: Role = (user.publicMetadata.role as Role) || 'PASSENGER';
    const userData: UserData = {
        id: user.id, // Include Clerk user ID
        firstName: user.firstName,
    };

    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return {
            props: {
                userData,
                passenger,
                buses,
                error: null,
                role,
            },
            error: null,
        };
    } catch (error) {
        console.error('Server - Error fetching passenger data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load passenger data';
        return {
            props: {
                userData,
                passenger: null,
                buses: [],
                error: errorMessage,
                role,
            },
            error: errorMessage,
        };
    }
}

// server.tsx
export async function Page() {
    const user = await currentUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    const { props, error } = await PassengerDashboardServer();

    if (error === 'User is not a passenger') {
        redirect('/dashboard');
    }

    // Ensure we're passing the most current user data
    return (
        <PassengerDashboardClient
            {...props}
            userData={{
                id: user.id,
                firstName: user.firstName,
            }}
        />
    );
}
