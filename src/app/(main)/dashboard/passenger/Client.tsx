// src/app/dashboard/passenger/client.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';
import RealTimeNotifications from '@/lib/websockets/index';
import { User } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

type Passenger = Prisma.UserGetPayload<{
    include: {
        reservations: {
            include: { trip: { include: { bus: true } } };
        };
    };
}>;

type Bus = Prisma.BusGetPayload<{}>;

interface Props {
    user: User | null;
    passenger: Passenger | null;
    buses: Bus[];
    error: string | null;
}

export default function PassengerDashboardClient({ user, passenger, buses, error }: Props) {
    const [hasReservations, setHasReservations] = useState(false);

    useEffect(() => {
        if (passenger) {
            setHasReservations(passenger.reservations.length > 0);
        }
    }, [passenger]);

    if (!user) {
        return (
            <div className="container mx-auto py-8">
                <p>Please sign in to access the passenger dashboard.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <p>{error}</p>
            </div>
        );
    }

    if (!passenger) {
        return (
            <div className="container mx-auto py-8">
                <p>Failed to load passenger data</p>
            </div>
        );
    }

    if (!hasReservations) {
        return (
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6">Welcome, {passenger.name || user.firstName}!</h1>
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Get Started</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            You don’t have any active reservations yet. Reserve a seat to start tracking your trip and
                            receiving notifications!
                        </p>
                        {buses.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Available Buses:</p>
                                {buses.map((bus) => (
                                    <div key={bus.id} className="flex justify-between items-center">
                                        <span>
                                            {bus.licensePlate} (Capacity: {bus.capacity})
                                        </span>
                                        <Link href={`/reserve?busId=${bus.id}`}>
                                            <Button variant="outline" size="sm">
                                                Reserve
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No buses available for reservation at the moment.</p>
                        )}
                    </CardContent>
                </Card>
                <div className="mt-6 flex gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                    <Button
                        onClick={() =>
                            fetch('/api/auth/signout', { method: 'POST' }).then(() => (window.location.href = '/'))
                        }
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Welcome, {passenger.name || user.firstName}!</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Your Reservations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {passenger.reservations.map((reservation) => (
                            <div key={reservation.id} className="border-b pb-2">
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
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Available Buses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {buses.length > 0 ? (
                            buses.map((bus) => (
                                <div key={bus.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p>
                                            <strong>{bus.licensePlate}</strong>
                                        </p>
                                        <p className="text-sm text-muted-foreground">Capacity: {bus.capacity} seats</p>
                                    </div>
                                    <Link href={`/reserve?busId=${bus.id}`}>
                                        <Button variant="outline" size="sm">
                                            Reserve Seats
                                        </Button>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p>No buses available for reservation.</p>
                        )}
                    </CardContent>
                </Card>

                <Suspense
                    fallback={
                        <Card>
                            <CardContent>Loading notifications...</CardContent>
                        </Card>
                    }
                >
                    <RealTimeNotifications userId={passenger.id} />
                </Suspense>
            </div>

            <div className="mt-6 flex gap-4">
                <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
                <Button
                    onClick={() =>
                        fetch('/api/auth/signout', { method: 'POST' }).then(() => (window.location.href = '/'))
                    }
                >
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
