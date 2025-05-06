// src/lib/vehicleUtils.tsx
'use server';
import { getBuses } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
export async function getVehiclesByCategory({ categoryKey, licensePlate, page = 1, pageSize = 10, }) {
    try {
        // Validate inputs
        let capacity;
        if (categoryKey) {
            const validCapacities = Object.keys(matatuConfigs);
            if (validCapacities.includes(categoryKey)) {
                capacity = categoryKey;
            }
            else {
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
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error fetching vehicles for ${licensePlate ? `license plate ${licensePlate}` : `category ${categoryKey}`}: ${errorMsg}`);
        throw new Error(`Failed to fetch vehicles: ${errorMsg}`);
    }
}
// This is the App Router way to fetch data for server components
export async function getServerSideData(params) {
    const licensePlate = params.licensePlate || '';
    const categories = Object.entries(matatuConfigs).map(([key, config]) => ({
        key: key,
        title: config.title,
    }));
    const searchResults = licensePlate.trim()
        ? await getVehiclesByCategory({ licensePlate: licensePlate.trim() })
        : null;
    return {
        categories,
        searchResults,
        licensePlate,
    };
}
