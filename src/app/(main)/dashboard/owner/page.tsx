// src/app/(main)/dashboard/owner/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOwnerData } from './ownerUtils';
import ClientOwnerDashboard from './clientOwnerDashboard';
import { ROLES, Role } from '@/utils/constants/roles';

export default async function OwnerDashboard() {
    const user = await currentUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    // Log raw metadata for debugging
    const rawRole = user.unsafeMetadata.role as string | undefined; // Changed from publicMetadata
    const role = rawRole?.toUpperCase().trim() as Role | undefined;

    if (!role) {
        redirect('/');
    }

    switch (role) {
        case ROLES.PASSENGER:
            redirect('/dashboard/passenger');
        case ROLES.DRIVER:
            redirect('/dashboard/driver');
        case ROLES.OWNER:
            break;
        default:
            redirect('/');
    }

    let ownerData;
    try {
        ownerData = await getOwnerData(user.id);
    } catch (error) {
        return (
            <div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load owner data'}</p>
            </div>
        );
    }

    const { trips, buses, drivers, reservations, incomeExpenses, geofences, reports, users } = ownerData;

    return (
        <ClientOwnerDashboard
            user={user}
            trips={trips}
            buses={buses}
            drivers={drivers}
            reservations={reservations}
            incomeExpenses={incomeExpenses}
            geofences={geofences}
            reports={reports}
            users={users}
            role={role}
        />
    );
}
