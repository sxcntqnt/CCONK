import { Suspense } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getVehiclesByCategory } from './vehicleUtils';
import Link from 'next/link';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

export default async function VehiclesPage() {
    const categories = Object.entries(matatuConfigs).map(([key, config]) => ({
        key,
        title: config.title,
    }));

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
                <div className="container mx-auto px-4 py-8">
                    {categories.map(({ key, title }) => (
                        <div key={key} className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">{title}</h2>
                            <VehicleCarousel categoryKey={key} />
                        </div>
                    ))}
                </div>
            </Suspense>
        </div>
    );
}

async function VehicleCarousel({ categoryKey }: { categoryKey: string }) {
    const vehicles = await getVehiclesByCategory(categoryKey);

    return (
        <Carousel className="w-full max-w-sm mx-auto">
            <CarouselContent className="-ml-1">
                {vehicles.map((vehicle) => (
                    <CarouselItem key={vehicle.id} className="pl-1 md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                            <Link href={`/vehicles/${vehicle.id}`}>
                                <motion.div
                                    whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                                        <CardHeader className="p-0">
                                            <Image
                                                src="/placeholder.jpg"
                                                alt={vehicle.licensePlate}
                                                width={256}
                                                height={144}
                                                className="w-full h-36 object-cover rounded-t-lg"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="/placeholder.jpg"
                                            />
                                        </CardHeader>
                                        <CardContent className="p-4 flex flex-col items-center justify-center">
                                            <h3 className="text-lg font-semibold text-white truncate">
                                                {vehicle.licensePlate}
                                            </h3>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-0 flex justify-center">
                                            <p className="text-sm text-gray-300">{vehicle.capacity}-Seater</p>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            </Link>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    );
}
