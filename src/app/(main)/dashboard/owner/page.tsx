// src/app/(main)/dashboard/owner/page.tsx
// No 'use client' here - this is a Server Component

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOwnerData } from './ownerUtils';
import ClientOwnerDashboard from './clientOwnerDashboard'; // New client-side component

export default async function OwnerDashboard() {
    const user = await currentUser();

    if (!user) {
        redirect('/sign-in'); // Use redirect instead of returning JSX
    }

    // Extract role from publicMetadata
    const role = user.publicMetadata.role as 'OWNER' | 'PASSENGER' | 'DRIVER' | undefined;

    // Handle case where role might not be set
    if (!role) {
        return (
            <div className="container mx-auto py-8">
                <p>Error: User role not defined in public metadata.</p>
            </div>
        );
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

    // Pass data to the Client Component
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
