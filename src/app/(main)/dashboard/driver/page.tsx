// src/app/(main)/dashboard/driver/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDriverData, handleArrival } from './driverUtils';
import { Suspense } from 'react';
import RealTimeTripUpdates from '@/lib/websocket/RTU';
import { ROLES, Role } from '@/utils/constants/roles';

export default async function DriverDashboard() {
    const user = await currentUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    // Extract and normalize role with debugging
    const rawRole = user.unsafeMetadata.role as string | undefined; // Changed from publicMetadata
    const role = rawRole?.toUpperCase().trim() as Role | undefined;

    if (!role) {
        redirect('/');
    }

    switch (role) {
        case ROLES.PASSENGER:
            redirect('/dashboard/passenger');
        case ROLES.OWNER:
            redirect('/dashboard/owner');
        case ROLES.DRIVER:
            break;
        default:
            redirect('/');
    }

    // At this point, role is DRIVER
    let driverData;
    try {
        driverData = await getDriverData(user.id);
        if (!driverData) {
            throw new Error('No driver data returned');
        }
    } catch (error) {
        console.error('Error fetching driver data:', error);
        return (
            <div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load driver data'}</p>
            </div>
        );
    }

    const { driver, trip } = driverData;

    if (!driver || typeof driver !== 'object') {
        return (
            <div className="container mx-auto py-8">
                <p>Invalid driver data</p>
            </div>
        );
    }

    if (!trip || typeof trip !== 'object') {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Trip</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You have no active trips assigned at the moment.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex">
            <div className="container mx-auto py-8 flex-1">
                <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Active Trip #{trip.id}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Bus</p>
                                <p className="text-lg">
                                    {trip.bus?.licensePlate ?? 'N/A'} (Capacity: {trip.bus?.capacity ?? 'N/A'})
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Route</p>
                                <p className="text-lg">
                                    {trip.departureCity ?? 'N/A'} → {trip.arrivalCity ?? 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Departure</p>
                                <p className="text-lg">
                                    {trip.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Suspense
                        fallback={
                            <Card>
                                <CardContent>Loading reservation updates...</CardContent>
                            </Card>
                        }
                    >
                        <RealTimeTripUpdates tripId={trip.id} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
