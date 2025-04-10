// src/app/(main)/dashboard/passenger/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import PassengerDashboardClient from './client';
import { ROLES, Role } from '@/utils/constants/roles';
import { Prisma } from '@prisma/client';
import DashboardLayout from '../layout';

type Passenger = Prisma.UserGetPayload<{
    include: {
        reservations: {
            include: { trip: { include: { bus: true } } };
        };
    };
}>;

type Bus = Prisma.BusGetPayload<{}>;

interface UserData {
    id: string;
    firstName: string | null;
}

interface DashboardProps {
    userData: UserData | null;
    passenger: Passenger | null;
    buses: Bus[];
    error: string | null;
    role: Role;
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts: number = 3, delayMs: number = 1000): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}

async function getPassengerData(clerkId: string): Promise<{ passenger: Passenger; buses: Bus[] }> {
    const passenger = await withRetry(async () => {
        const result = await db.user.findUnique({
            where: { clerkId },
            include: {
                reservations: {
                    where: { status: 'confirmed' },
                    include: { trip: { include: { bus: true } } },
                    orderBy: { bookedAt: 'desc' },
                },
            },
        });

        if (!result || result.role !== 'PASSENGER') {
            throw new Error('User is not a passenger');
        }
        return result;
    });

    const buses = await withRetry(async () => {
        return await db.bus.findMany({
            where: { trips: { some: { status: 'scheduled' } } },
            take: 10,
        });
    });

    return { passenger, buses };
}

export default async function Page() {
    const user = await currentUser();
    if (!user) {
        redirect('/auth/sign-in'); // Redundant due to parent, but kept as safety net
    }

    const userData: UserData = {
        id: user.id,
        firstName: user.firstName || 'Passenger',
    };
    // Extract role from publicMetadata
    const rawRole = user.unsafeMetadata.role as string | undefined; // Changed from publicMetadata
    const role = rawRole?.toUpperCase().trim() as Role | undefined;

    if (!role) {
        redirect('/');
    }

    switch (role) {
        case ROLES.PASSENGER:
            break;
        case ROLES.DRIVER:
            redirect('/dashboard/driver');
        case ROLES.OWNER:
            redirect('/dashboard/owner');
        default:
            redirect('/');
    }

    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return (
            <DashboardLayout role={role}>
                <PassengerDashboardClient
                    userData={userData}
                    passenger={passenger}
                    buses={buses}
                    error={null}
                    role={role}
                />
            </DashboardLayout>
        );
    } catch (error) {
        console.error('Error fetching passenger data:', error);
        return (
            <DashboardLayout role={role}>
                <PassengerDashboardClient
                    userData={userData}
                    passenger={null}
                    buses={[]}
                    error={error instanceof Error ? error.message : 'Failed to load dashboard data'}
                    role={role}
                />
            </DashboardLayout>
        );
    }
}
