// src/lib/vehicleUtils.tsx
'use server';
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
        let capacity: MatatuCapacity | undefined;
        if (categoryKey) {
            const validCapacities = Object.keys(matatuConfigs) as MatatuCapacity[];
            if (validCapacities.includes(categoryKey as MatatuCapacity)) {
                capacity = categoryKey as MatatuCapacity;
            } else {
                throw new Error(`Invalid category key: ${categoryKey} (not a valid capacity)`);
            }
        }

        if (licensePlate && (typeof licensePlate !== 'string' || licensePlate.trim() === '')) {
            throw new Error(`Invalid license plate: ${licensePlate}`);
        }

        // Convert capacity to number for getBuses
        const numericCapacity = capacity ? parseInt(capacity) : undefined;

        // Fetch buses with filters
        const { buses, total } = await getBuses(page, pageSize, {
            licensePlate: licensePlate?.trim(),
            capacity: numericCapacity, // Pass numeric capacity
        });

        // Map to carousel format
        const mappedBuses = buses.map((bus) => ({
            id: bus.id.toString(),
            licensePlate: bus.licensePlate,
            capacity: bus.capacity, // Already MatatuCapacity from getBuses
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
export const getServerSideProps: GetServerSideProps = async (context) => {
    const licensePlate = (context.query.licensePlate as string) || '';
    const categories = Object.entries(matatuConfigs).map(([key, config]) => ({
        key: key as MatatuCapacity,
        title: config.title,
    }));

    const searchResults = licensePlate.trim()
        ? await getVehiclesByCategory({ licensePlate: licensePlate.trim() })
        : null;

    return {
        props: {
            categories,
            searchResults,
            licensePlate,
        },
    };
};
