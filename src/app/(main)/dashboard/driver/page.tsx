// pages/driver-dashboard.tsx
// No 'use client' - this is a server component

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';
import { Suspense } from 'react';
import RealTimeTripUpdates from ''@lib/websocket/RTU;

// Fetch driver and trip data server-side
async function getDriverData(clerkId: string) {
    const driver = await prisma.user.findUnique({
        where: { clerkId },
        include: {
            driver: {
                include: {
                    trips: {
                        where: { status: { in: ['scheduled', 'in_progress'] }, arrivalTime: null },
                        include: { bus: true },
                        orderBy: { departureTime: 'desc' },
                        take: 1, // Most recent active trip
                    },
                },
            },
        },
    });

    if (!driver || driver.role !== 'DRIVER' || !driver.driver) {
        throw new Error('User is not a driver or has no driver profile');
    }

    return {
        driver,
        trip: driver.driver.trips[0] || null, // Active trip or null
    };
}

// Server action wrapper for notifyDriverArrival
async function handleArrival(formData: FormData) {
    'use server';
    await notifyDriverArrival(formData);
}

export default async function DriverDashboard() {
    const user = await currentUser();
    if (!user) {
        return (
            <div className="container mx-auto py-8">
                <p>Please sign in to access the driver dashboard.</p>
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
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Trip Card */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Active Trip #{trip.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-sm text-muted-foreground">Bus</Label>
                            <p className="text-lg">
                                {trip.bus.licensePlate} (Capacity: {trip.bus.capacity})
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm text-muted-foreground">Route</Label>
                            <p className="text-lg">
                                {trip.departureCity} → {trip.arrivalCity}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm text-muted-foreground">Departure</Label>
                            <p className="text-lg">{new Date(trip.departureTime).toLocaleString()}</p>
                        </div>

                        {/* Notify Arrival Form */}
                        <form action={handleArrival} className="space-y-4">
                            <input type="hidden" name="tripId" value={trip.id} />
                            <div>
                                <Label htmlFor="destination">Arrival Destination</Label>
                                <Input
                                    id="destination"
                                    name="destination"
                                    placeholder="Enter arrival destination"
                                    defaultValue={trip.arrivalCity}
                                    disabled={trip.status === 'completed'}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={trip.status === 'completed'}>
                                Notify Arrival
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Real-Time Updates Card */}
                <Suspense
                    fallback={
                        <Card>
                            <CardContent>Loading updates...</CardContent>
                        </Card>
                    }
                >
                    <RealTimeTripUpdates tripId={trip.id} />
                </Suspense>
            </div>
        </div>
    );
}
