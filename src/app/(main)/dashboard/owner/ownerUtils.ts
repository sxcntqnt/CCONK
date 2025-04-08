// src/app/(main)/dashboard/owner/ownerUtils.ts
import { db } from '@/lib';

export async function getOwnerData(clerkId: string) {
    const owner = await db.user.findUnique({
        where: { clerkId },
        include: {
            owner: {
                include: {
                    buses: {
                        include: {
                            trips: {
                                where: { status: { in: ['scheduled', 'in_progress'] } },
                                orderBy: { departureTime: 'desc' },
                            },
                            drivers: true,
                        },
                    },
                    incomeExpenses: true, // Corrected from IncomeExpense to incomeExpenses
                    geofences: true,
                    reports: true,
                },
            },
            reservations: true,
        },
    });

    if (!owner || owner.role !== 'OWNER' || !owner.owner) {
        throw new Error('User is not an owner or has no owner profile');
    }

    const trips = owner.owner.buses.flatMap((bus) => bus.trips);
    const drivers = owner.owner.buses.flatMap((bus) => bus.drivers);

    return {
        trips,
        buses: owner.owner.buses,
        drivers,
        reservations: owner.reservations,
        incomeExpenses: owner.owner.incomeExpenses, // Matches schema
        geofences: owner.owner.geofences,
        reports: owner.owner.reports,
        users: [],
    };
}
