import { db } from '@/lib';

// Function to fetch owner data from the database
export async function getOwnerData(clerkId: string) {
    const owner = await db.user.findUnique({
        where: { clerkId },
        include: {
            owner: {
                include: {
                    trips: {
                        where: { status: { in: ['scheduled', 'in_progress'] } },
                        orderBy: { departureTime: 'desc' },
                    },
                    buses: true,
                    drivers: true,
                    reservations: true,
                    incomeExpenses: true,
                    geofences: true,
                    reports: true,
                    users: true,
                },
            },
        },
    });

    if (!owner || owner.role !== 'OWNER' || !owner.owner) {
        throw new Error('User  is not an owner or has no owner profile');
    }

    return {
        trips: owner.owner.trips,
        buses: owner.owner.buses,
        drivers: owner.owner.drivers,
        reservations: owner.owner.reservations,
        incomeExpenses: owner.owner.incomeExpenses,
        geofences: owner.owner.geofences,
        reports: owner.owner.reports,
        users: owner.owner.users,
    };
}
