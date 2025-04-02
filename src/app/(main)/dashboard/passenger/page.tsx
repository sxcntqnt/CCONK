// src/app/dashboard/passenger/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { getBuses } from '@/lib/prisma/dbClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function PassengerDashboard() {
  const { user, signOut } = useClerk();
  const router = useRouter();

  if (!user || user.publicMetadata.role !== 'passenger') {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p>Unauthorized: Passengers only.</p>
      </div>
    );
  }

  const { buses, total } = await getBuses(1, 10); // Fetch all available buses

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-xl font-medium">Welcome {user.firstName}!</h1>
      <p className="mt-2 text-gray-500">Available Buses for Reservation</p>

      <div className="mt-6 w-full max-w-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Bus</th>
              <th className="p-2 text-left">Capacity</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {buses.map(bus => (
              <tr key={bus.id} className="border-b">
                <td className="p-2">{bus.licensePlate}</td>
                <td className="p-2">{bus.capacity} seats</td>
                <td className="p-2 text-right">
                  <Link href={`/dashboard/passenger/reserve?busId=${bus.id}`}>
                    <Button variant="outline" size="sm">Reserve Seats</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {buses.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-center">
                  No buses available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Button onClick={() => router.push('/')} variant="outline">
          Back to Home
        </Button>
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    </div>
  );
}
