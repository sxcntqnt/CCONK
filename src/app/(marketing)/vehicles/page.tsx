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
                <div className="container mx-auto px-4 py-12">
                    {categories.map(({ key, title }) => (
                        <section key={key} className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">{title}</h2>
                            <VehicleCarousel categoryKey={key} />
                        </section>
                    ))}
                </div>
            </Suspense>
        </div>
    );
}

async function VehicleCarousel({ categoryKey }: { categoryKey: string }) {
    const vehicles = await getVehiclesByCategory(categoryKey);

    return (
        <Carousel
            className="w-full"
            opts={{
                align: 'start',
                loop: false,
            }}
        >
            <CarouselContent className="flex gap-4 p-2">
                {vehicles.map((vehicle) => (
                    <CarouselItem
                        key={vehicle.id}
                        className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                    >
                        <Link href={`/vehicles/${vehicle.id}`}>
                            <motion.div
                                whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="h-full"
                            >
                                <Card className="bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors h-full flex flex-col">
                                    <CardHeader className="p-0">
                                        <Image
                                            src="/placeholder.jpg"
                                            alt={vehicle.licensePlate}
                                            width={320}
                                            height={180}
                                            className="w-full h-48 object-cover rounded-t-lg"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="/placeholder.jpg"
                                        />
                                    </CardHeader>
                                    <CardContent className="p-4 flex flex-col items-center justify-center flex-grow">
                                        <h3 className="text-lg font-semibold text-white truncate w-full text-center">
                                            {vehicle.licensePlate}
                                        </h3>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex justify-center">
                                        <p className="text-sm text-gray-300">{vehicle.capacity}-Seater</p>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-6 bg-gray-800 hover:bg-gray-700 text-white" />
            <CarouselNext className="hidden sm:flex -right-6 bg-gray-800 hover:bg-gray-700 text-white" />
        </Carousel>
    );
}
