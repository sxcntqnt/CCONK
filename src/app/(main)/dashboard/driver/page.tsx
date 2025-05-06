// src/app/(main)/dashboard/driver/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import RealTimeTripUpdates from '@/lib/websocket/RTU';
import { ROLES, Role } from '@/utils/constants/roles';
import { getDriverData, getReservationCount } from '@/utils/functions/driverUtils';

export default async function DriverDashboard() {
    const user = await currentUser();

    // Redirect if user is not authenticated
    if (!user) {
        redirect('/auth/sign-in');
    }

    // Normalize and validate role
    const rawRole = user.unsafeMetadata.role as string | undefined;
    const role = rawRole?.toUpperCase().trim() as Role | undefined;

    if (!role) {
        redirect('/');
    }

    // Redirect based on role
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

    // Fetch driver data
    let driverData;
    try {
        driverData = await getDriverData(user.id);
    } catch (error) {
        console.error('Error fetching driver data:', error);
        return (
            <div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load driver data'}</p>
            </div>
        );
    }

    // Check if driverData.data exists
    if (!driverData.data) {
        return (
            <div className="container mx-auto py-8">
                <p>No driver data available</p>
            </div>
        );
    }

    // Destructure driver and trip from driverData.data
    const { driver, trip } = driverData.data;

    // Handle invalid driver data
    if (!driver) {
        return (
            <div className="container mx-auto py-8">
                <p>Invalid driver data</p>
            </div>
        );
    }

    // Handle no active trip
    if (!trip) {
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

    // Fetch reservation count
    const reservationCount = await getReservationCount(trip.id);

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
                            <div>
                                <p className="text-sm text-muted-foreground">Bus Occupancy</p>
                                <p className="text-lg">
                                    {reservationCount.data ?? 0} of {trip.bus?.capacity ?? 'N/A'} seats reserved
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
                        <RealTimeTripUpdates tripId={trip.id} driverId={trip.bus?.id.toString() ?? '0'} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
