// src/app/dashboard/driver/page.tsx
'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getBuses, getSeats } from '@/lib/prisma/dbClient';
import { notifyDriverArrival } from '@/actions/notifyDriverArrival';

import { Badge } from '@/components/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/Table';
import Container from '@/components/Container';
import { cn } from '@/lib/utils';

export default async function DriverDashboard() {
  const driver = await currentUser();
  if (!driver || driver.publicMetadata.role !== 'driver') {
    return <Container><p>Unauthorized: Drivers only.</p></Container>;
  }

  const { buses } = await getBuses(1, 1, driver.id); // Fetch driver's bus
  if (!buses.length) {
    return (
      <Container>
        <h2 className="text-3xl font-semibold mb-6">Driver Dashboard</h2>
        <p>No bus assigned to you.</p>
      </Container>
    );
  }

  const bus = buses[0];
  const seats = await getSeats(bus.id);
  const reservedSeats = Object.values(seats).filter(seat => seat.status === 'reserved');

  async function handleArrival(formData: FormData) {
    'use server';
    await notifyDriverArrival(formData);
  }

  return (
    <Container>
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-3xl font-semibold">
          Driver Dashboard - Bus {bus.licensePlate}
        </h2>
        <form action={handleArrival} className="flex items-center gap-4">
          <input
            type="text"
            name="destination"
            placeholder="Enter destination"
            className="border rounded p-2"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Notify Arrival
          </button>
        </form>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Seat Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Position</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservedSeats.map(seat => (
            <TableRow key={seat.id}>
              <TableCell>{seat.label}</TableCell>
              <TableCell>
                <Badge className={cn("text-xs", seat.status === 'reserved' && 'bg-red-600')}>
                  {seat.status}
                </Badge>
              </TableCell>
              <TableCell>${seat.price}</TableCell>
              <TableCell>
                Row {seat.row}, Col {seat.column} ({seat.category})
              </TableCell>
            </TableRow>
          ))}
          {reservedSeats.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No reservations for this bus yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Container>
  );
}
