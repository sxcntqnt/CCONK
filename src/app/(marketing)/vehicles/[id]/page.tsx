import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSeats, getBus } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define valid capacities based on matatuConfigs keys
type MatatuCapacity = keyof typeof matatuConfigs;

interface VehicleDetailsPageProps {
    params: { id: string };
}

export default async function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
    const busId = parseInt(params.id, 10);

    if (isNaN(busId)) {
        notFound();
    }

    let bus: { id: number; licensePlate: string; capacity: number } | null = null;
    let seats: Record<
        string,
        {
            id: string;
            label: string;
            status: 'available' | 'selected' | 'reserved';
            price: number;
            row?: number;
            column?: number;
            category?: string;
        }
    > | null = null;

    try {
        bus = await getBus(busId);
        seats = await getSeats(busId);
    } catch (error) {
        console.error('Error fetching bus details:', error);
        notFound();
    }

    if (!bus) {
        notFound();
    }

    // Validate bus.capacity against matatuConfigs keys
    const validCapacities = Object.keys(matatuConfigs).map(Number) as MatatuCapacity[];
    if (!validCapacities.includes(bus.capacity as MatatuCapacity)) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-400">Invalid vehicle capacity: {bus.capacity}.</p>
                </div>
            </div>
        );
    }

    const busCapacity = bus.capacity as MatatuCapacity;
    const config = matatuConfigs[busCapacity];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
                <div className="container mx-auto px-4 py-8">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
                            <p className="text-sm text-gray-300">License Plate: {bus.licensePlate}</p>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-lg font-semibold mb-4">Seat Layout</h3>
                            {seats && Object.keys(seats).length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {config.layout.map((row, rowIndex) => (
                                        <div key={rowIndex} className="flex justify-center gap-4">
                                            {row.map((section, sectionIndex) => (
                                                <div key={sectionIndex} className="flex gap-2">
                                                    {section.map((seatNumber) => {
                                                        const seat = Object.values(seats).find(
                                                            (s) => s.label === String(seatNumber),
                                                        );
                                                        return (
                                                            <div
                                                                key={seatNumber}
                                                                className={`w-10 h-10 flex items-center justify-center rounded-md text-white ${
                                                                    !seat
                                                                        ? 'bg-gray-500'
                                                                        : seat.status === 'available'
                                                                          ? 'bg-green-500'
                                                                          : seat.status === 'reserved'
                                                                            ? 'bg-red-500'
                                                                            : 'bg-blue-500'
                                                                }`}
                                                            >
                                                                {seat?.label || seatNumber}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-300">No seats available.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Suspense>
        </div>
    );
}
