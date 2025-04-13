import { getBuses } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';

export async function getVehiclesByCategory(categoryKey: string) {
    try {
        // Validate categoryKey exists in matatuConfigs
        if (!(categoryKey in matatuConfigs)) {
            console.warn(`Invalid category key: ${categoryKey}`);
            return [];
        }

        // Get capacity from matatuConfigs
        const capacity = matatuConfigs[categoryKey as keyof typeof matatuConfigs].totalSeats;

        // Fetch buses with matching capacity
        const { buses } = await getBuses(1, 10); // Fetch first page, max 10 buses

        // Filter buses by capacity
        const filteredBuses = buses.filter((bus) => bus.capacity === capacity);

        return filteredBuses;
    } catch (error) {
        console.error(`Error fetching vehicles for category ${categoryKey}:`, error);
        return [];
    }
}
