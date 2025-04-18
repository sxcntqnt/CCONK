import { getBuses } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';

// Define valid capacities based on matatuConfigs keys
type MatatuCapacity = keyof typeof matatuConfigs;

export async function getVehiclesByCategory(categoryKey: string) {
    try {
        // Convert categoryKey to number and validate
        const capacity = Number(categoryKey);
        if (isNaN(capacity)) {
            console.warn(`Invalid category key: ${categoryKey} (not a number)`);
            return [];
        }

        const validCapacities = Object.keys(matatuConfigs).map(Number) as MatatuCapacity[];
        if (!validCapacities.includes(capacity as MatatuCapacity)) {
            console.warn(`Invalid category key: ${categoryKey}`);
            return [];
        }

        // Fetch buses with matching capacity
        const { buses } = await getBuses(1, 10); // Fetch first page, max 10 buses

        // Filter buses by capacity (not category)
        const filteredBuses = buses
            .filter((bus) => bus.capacity === (capacity as MatatuCapacity))
            .map((bus) => ({
                ...bus,
                imageUrl: bus.imageUrl && typeof bus.imageUrl === 'string' ? bus.imageUrl : '/placeholder.jpg',
            }));

        return filteredBuses;
    } catch (error) {
        console.error(`Error fetching vehicles for category ${categoryKey}:`, error);
        return [];
    }
}
