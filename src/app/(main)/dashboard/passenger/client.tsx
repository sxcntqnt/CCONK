// src/app/(main)/dashboard/passenger/client.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/ui/appSidebar';
import Link from 'next/link';
import RealTimeTripUpdates from '@/lib/websocket/RTU';
import { useClerk } from '@clerk/nextjs';
import { Prisma } from '@prisma/client';
import { Role } from '@/utils/constants/roles';
import { AnimationContainer, MaxWidthWrapper } from '@/components';
import { LampContainer } from '@/components/ui/lamp';
import MagicBadge from '@/components/ui/magic-badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserData {
    id: string;
    firstName: string | null;
}

type Passenger = Prisma.UserGetPayload<{
    include: {
        reservations: {
            include: { trip: { include: { bus: true } } };
        };
    };
}>;

type Bus = Prisma.BusGetPayload<{}>;

interface Props {
    userData: UserData | null;
    passenger: Passenger | null;
    buses: Bus[];
    error: string | null;
    role: Role;
}

export default function PassengerDashboardClient({ userData, passenger, buses, error, role }: Props) {
    const [hasReservations, setHasReservations] = useState<boolean | null>(null);
    const { signOut } = useClerk();

    useEffect(() => {
        setHasReservations(passenger ? passenger.reservations.length > 0 : false);
    }, [passenger]);

    if (!userData || error || !passenger || hasReservations === null) {
        return (
            <MaxWidthWrapper className="py-6">
                <p className="text-red-500">{error || 'Loading...'}</p>
            </MaxWidthWrapper>
        );
    }

    console.log('Clerk User ID:', userData.id);

    return (
        <div className="flex min-h-screen bg-gray-950">
            {/* Sidebar */}
            <AppSidebar role={role} />

            {/* Main Content Area */}
            <main className="flex-1">
                <LampContainer>
                    <AnimationContainer>
                        <h1 className="text-4xl font-bold text-white text-center mb-4">
                            Welcome, {passenger.name || userData.firstName}!
                        </h1>
                        <MagicBadge title="Your Dashboard" />
                    </AnimationContainer>
                </LampContainer>

                <MaxWidthWrapper className="py-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Reservations Card */}
                        <Card className="bg-gray-900 text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    Your Reservations
                                    <MagicBadge title={passenger.reservations.length.toString()} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    {hasReservations ? (
                                        passenger.reservations.map((reservation) => (
                                            <div key={reservation.id} className="py-2">
                                                <p>
                                                    <strong>Bus:</strong> {reservation.trip.bus.licensePlate}
                                                </p>
                                                <p>
                                                    <strong>Route:</strong> {reservation.trip.departureCity} →{' '}
                                                    {reservation.trip.arrivalCity}
                                                </p>
                                                <p>
                                                    <strong>Departure:</strong>{' '}
                                                    {new Date(reservation.trip.departureTime).toLocaleString()}
                                                </p>
                                                <p>
                                                    <strong>Seat:</strong> {reservation.seatId}
                                                </p>
                                                <p>
                                                    <strong>Status:</strong> {reservation.trip.status}
                                                </p>
                                                <Separator className="my-2 bg-gray-700" />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400">No reservations yet.</p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Available Buses Card */}
                        <Card className="bg-gray-900 text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    Available Buses
                                    <MagicBadge title={buses.length.toString()} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    {buses.length > 0 ? (
                                        buses.map((bus) => (
                                            <div
                                                key={bus.id}
                                                className="flex justify-between items-center py-2"
                                            >
                                                <div>
                                                    <p>
                                                        <strong>{bus.licensePlate}</strong>
                                                    </p>
                                                    <p className="text-sm text-gray-300">
                                                        Capacity: {bus.capacity} seats
                                                    </p>
                                                </div>
                                                <Link href={`/reserve?busId=${bus.id}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-white border-gray-700 hover:bg-gray-700"
                                                    >
                                                        Reserve Seats
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400">No buses available.</p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Real-Time Updates */}
                        {passenger.reservations.map((reservation) => (
                            <Card key={reservation.tripId} className="bg-gray-900 text-white border-none shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl">Trip Updates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RealTimeTripUpdates tripId={reservation.tripId} />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-4">
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="text-white border-gray-700 hover:bg-gray-700 w-32"
                            >
                                Back to Home
                            </Button>
                        </Link>
                        <Button
                            onClick={() => signOut({ redirectUrl: '/' })}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-32"
                        >
                            Sign Out
                        </Button>
                    </div>
                </MaxWidthWrapper>
            </main>
        </div>
    );
}
