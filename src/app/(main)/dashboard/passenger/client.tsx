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

interface UserData {
  id: string; // Add Clerk user ID
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
      <div className="container mx-auto py-8">
        <p>{error || 'Loading...'}</p>
      </div>
    );
  }

  // Example: Log the user ID for debugging (optional)
  console.log('Clerk User ID:', userData.id);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AppSidebar role={role} />
      {/* Main Content Area */}
      <main className="flex-1 p-6 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6">Welcome, {passenger.name || userData.firstName}!</h1>

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
                    <strong>Route:</strong> {reservation.trip.departureCity} → {reservation.trip.arrivalCity}
                  </p>
                  <p>
                    <strong>Departure:</strong> {new Date(reservation.trip.departureTime).toLocaleString()}
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
                      <Button variant="outline" size="sm">Reserve Seats</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p>No buses available for reservation.</p>
              )}
            </CardContent>
          </Card>

          {passenger.reservations.map((reservation) => (
            <RealTimeTripUpdates key={reservation.tripId} tripId={reservation.tripId} />
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Button onClick={() => signOut({ redirectUrl: '/' })}>Sign Out</Button>
        </div>
      </main>
    </div>
  );
}
