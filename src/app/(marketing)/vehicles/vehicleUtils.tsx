// src/lib/vehicleUtils.tsx
import { getBuses } from '@/lib/prisma/dbClient';
import { matatuConfigs, MatatuCapacity } from '@/utils/constants/matatuSeats';

export async function getVehiclesByCategory({
    categoryKey,
    licensePlate,
    page = 1,
    pageSize = 10,
}: {
    categoryKey?: string;
    licensePlate?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    vehicles: {
        id: string;
        licensePlate: string;
        capacity: MatatuCapacity;
        image: string;
        blurDataURL: string;
    }[];
    total: number;
}> {
    try {
        // Validate inputs
        let capacity: number | undefined;
        if (categoryKey) {
            capacity = Number(categoryKey);
            if (isNaN(capacity)) {
                throw new Error(`Invalid category key: ${categoryKey} (not a number)`);
            }
            const validCapacities = Object.keys(matatuConfigs).map(Number) as MatatuCapacity[];
            if (!validCapacities.includes(capacity as MatatuCapacity)) {
                throw new Error(`Invalid category key: ${categoryKey} (not a valid capacity)`);
            }
        }

        if (licensePlate && (typeof licensePlate !== 'string' || licensePlate.trim() === '')) {
            throw new Error(`Invalid license plate: ${licensePlate}`);
        }

        // Fetch buses with filters
        const { buses, total } = await getBuses(page, pageSize, {
            licensePlate: licensePlate?.trim(),
            capacity,
        });

        // Map to carousel format
        const mappedBuses = buses.map((bus) => ({
            id: bus.id.toString(),
            licensePlate: bus.licensePlate,
            capacity: bus.capacity as MatatuCapacity,
            image: bus.imageUrl ?? '/placeholder.jpg',
            blurDataURL: bus.imageUrl?.replace(/\.[^/.]+$/, '-blur.jpg') ?? '/placeholder.jpg',
        }));

        return { vehicles: mappedBuses, total };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(
            `Error fetching vehicles for ${licensePlate ? `license plate ${licensePlate}` : `category ${categoryKey}`}: ${errorMsg}`,
        );
        throw new Error(`Failed to fetch vehicles: ${errorMsg}`);
    }
}
