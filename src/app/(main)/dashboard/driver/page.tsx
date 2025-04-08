import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDriverData, handleArrival } from './driverUtils'; // Import the utility functions
import { AppSidebar } from '@/components/ui/appSidebar';
import { getNavItemsByRole, NavItem } from '@/components/config';
import { Suspense } from 'react';
import RealTimeTripUpdates from '@/lib/websocket/RTU';

export default async function DriverDashboard() {
    const user = await currentUser();

    if (!user) {
        return (
            <div className="container mx-auto py-8">
                <p>Please sign in to access the driver dashboard.</p>
            </div>
        );
    }

    //safely access publicMetadata
    const role = user.publicMetadata.role as 'OWNER' | 'PASSENGER' | 'DRIVER' | undefined;

    // Handle case where role might not be set
    if (!role) {
        return (
            <div className="container mx-auto py-8">
                <p>Error: User role not defined in public metadata.</p>
            </div>
        );
    }

    let driverData;

    try {
        driverData = await getDriverData(user.id);
    } catch (error) {
        return (
            <div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load driver data'}</p>
            </div>
        );
    }

    const { driver, trip } = driverData;

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

    return (
        <div className="flex">
            {/* Sidebar */}
            <AppSidebar role={role} />

            <div className="container mx-auto py-8 flex-1">
                <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Trip Card */}

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Active Trip #{trip.id}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Bus</p>

                                <p className="text-lg">
                                    {trip.bus.licensePlate} (Capacity: {trip.bus.capacity})
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Route</p>

                                <p className="text-lg">
                                    {trip.departureCity} → {trip.arrivalCity}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Departure</p>

                                <p className="text-lg">{new Date(trip.departureTime).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Real-Time Reservation Updates Card */}

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
