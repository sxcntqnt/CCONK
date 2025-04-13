import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSeats, getBus } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

    const busCapacity = String(bus.capacity);
    const config = matatuConfigs[busCapacity as keyof typeof matatuConfigs];

    if (!config) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-400">Configuration not found for this vehicle.</p>
                </div>
            </div>
        );
    }

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
                            {Object.keys(seats).length > 0 ? (
                                <div
                                    className="grid gap-2"
                                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))' }}
                                >
                                    {Object.values(seats).map((seat) => (
                                        <div
                                            key={seat.id}
                                            className={`p-2 text-center rounded-md text-white ${
                                                seat.status === 'available'
                                                    ? 'bg-green-500'
                                                    : seat.status === 'reserved'
                                                      ? 'bg-red-500'
                                                      : 'bg-blue-500'
                                            }`}
                                        >
                                            {seat.label}
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
