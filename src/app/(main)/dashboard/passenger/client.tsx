'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import RealTimeTripUpdates from '@/lib/websocket/RTU';
import { useClerk, useUser } from '@clerk/nextjs';
import { Role } from '@/utils/constants/roles';
import { Prisma } from '@/lib/prisma/client';
import { MaxWidthWrapper } from '@/components';
import MagicCard from '@/components/ui/magic-card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useDriverStore } from '@/store';

// Helper function to format status for display
const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

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
    const [reservationCounts, setReservationCounts] = useState<{ [tripId: number]: number }>({});
    const { signOut } = useClerk();
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const { setSelectedDriver, clearSelectedDriver } = useDriverStore();

    useEffect(() => {
        if (passenger) {
            setHasReservations(passenger.reservations.length > 0);
            // Set driver for the first reservation (optional, for compatibility with DriverDetails)
            if (passenger.reservations.length > 0) {
                const firstReservation = passenger.reservations[0];
                const driverId = parseInt(firstReservation.trip.bus.id.toString());
                setSelectedDriver(driverId);
            } else {
                clearSelectedDriver();
            }

            // Fetch reservation counts for each trip
            const fetchReservationCounts = async () => {
                const counts = await Promise.all(
                    passenger.reservations.map(async (reservation) => {
                        try {
                            const response = await fetch(`/api/reservations?tripId=${reservation.tripId}`);
                            if (!response.ok) throw new Error('Failed to fetch reservations');
                            const data = await response.json();
                            return { tripId: reservation.tripId, count: data.reservations.length };
                        } catch (error) {
                            console.error(`Failed to fetch reservations for trip ${reservation.tripId}:`, error);
                            return { tripId: reservation.tripId, count: 0 };
                        }
                    }),
                );
                setReservationCounts(counts.reduce((acc, { tripId, count }) => ({ ...acc, [tripId]: count }), {}));
            };
            if (passenger.reservations.length > 0) {
                fetchReservationCounts();
            }
        }
    }, [passenger, setSelectedDriver, clearSelectedDriver]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">Loading...</p>
            </div>
        );
    }

    if (!isSignedIn || !userData || error?.includes('Authentication failed') || error?.includes('Please sign in')) {
        router.push('/auth/sign-in');
        return (
            <div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">Redirecting to sign-in...</p>
            </div>
        );
    }

    if (error || !passenger || hasReservations === null) {
        return (
            <div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">{error || 'Loading your dashboard...'}</p>
                {error && (
                    <Button
                        variant="outline"
                        className="mt-4 text-white border-gray-700 hover:bg-gray-600"
                        onClick={() => router.refresh()}
                    >
                        Retry
                    </Button>
                )}
            </div>
        );
    }

    return (
        <main className="flex-1 bg-gray-950">
            <MaxWidthWrapper className="py-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">
                    Welcome, {passenger.name || userData.firstName}!
                </h1>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <MagicCard className="p-0 h-full w-full max-w-3xl">
                        <Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                            <CardHeader className="p-6">
                                <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground/80 group-hover:text-white">
                                    Your Reservations
                                    <span className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full">
                                        {passenger.reservations.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <ScrollArea className="h-40">
                                    {hasReservations ? (
                                        passenger.reservations.map((reservation) => (
                                            <div key={reservation.id} className="py-3">
                                                <p className="text-base">
                                                    <strong>Bus:</strong> {reservation.trip.bus.licensePlate}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Route:</strong> {reservation.trip.departureCity} →{' '}
                                                    {reservation.trip.arrivalCity}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Departure:</strong>{' '}
                                                    {new Date(reservation.trip.departureTime).toLocaleString()}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Seat:</strong> {reservation.seatId}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Status:</strong> {formatStatus(reservation.trip.status)}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Reservation Status:</strong>{' '}
                                                    {formatStatus(reservation.status)}
                                                </p>
                                                <Separator className="my-3 bg-gray-700" />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-base">No reservations yet.</p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </MagicCard>

                    <MagicCard className="p-0 h-full w-full max-w-xl">
                        <Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                            <CardHeader className="p-6">
                                <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground/80 group-hover:text-white">
                                    Available Buses
                                    <span className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full">
                                        {buses.length}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <ScrollArea className="h-40">
                                    {buses.length > 0 ? (
                                        buses.map((bus) => (
                                            <div key={bus.id} className="flex justify-between items-center py-3">
                                                <div>
                                                    <p className="font-semibold text-base">{bus.licensePlate}</p>
                                                    <p className="text-sm text-gray-300">
                                                        Capacity: {bus.capacity} seats
                                                    </p>
                                                </div>
                                                <Link href={`/reserve?busId=${bus.id}`} legacyBehavior>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-white border-gray-700 hover:bg-gray-600 transition-colors"
                                                    >
                                                        Reserve
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-400 text-base">No buses available.</p>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </MagicCard>

                    {passenger.reservations.map((reservation) => (
                        <MagicCard key={reservation.tripId} className="p-0 h-full w-full max-w-xl">
                            <Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-2xl font-semibold text-foreground/80 group-hover:text-white">
                                        Trip Updates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <ScrollArea className="h-40">
                                        <RealTimeTripUpdates
                                            tripId={reservation.tripId}
                                            driverId={reservation.trip.bus.id.toString()}
                                        />
                                        <p className="text-sm text-gray-300 mt-2">
                                            Bus Occupancy: {reservationCounts[reservation.tripId] || 0} of{' '}
                                            {reservation.trip.bus.capacity} seats reserved
                                        </p>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </MagicCard>
                    ))}
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <Link href="/" legacyBehavior>
                        <Button
                            variant="outline"
                            className="text-white border-gray-700 hover:bg-gray-600 w-32 transition-colors"
                        >
                            Back to Home
                        </Button>
                    </Link>
                    <Button
                        onClick={() => signOut({ redirectUrl: '/' })}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-32 transition-colors"
                    >
                        Sign Out
                    </Button>
                </div>
            </MaxWidthWrapper>
        </main>
    );
}
