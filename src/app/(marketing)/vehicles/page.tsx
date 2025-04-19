// src/app/vehicles/page.tsx
'use client';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getVehiclesByCategory } from './vehicleUtils';
import Link from 'next/link';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NRCCarousel, { Frame, FrameRenderedComponentPropsWithIndex } from '@/components/ui/NRCCarousel';
import { useIsMobile } from '@/hooks/use-mobile';

export default function VehiclesPage() {
    const [licensePlate, setLicensePlate] = useState('');
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
                <VehiclesContent licensePlate={licensePlate} setLicensePlate={setLicensePlate} />
            </Suspense>
        </div>
    );
}

async function VehiclesContent({
    licensePlate,
    setLicensePlate,
}: {
    licensePlate: string;
    setLicensePlate: (value: string) => void;
}) {
    const categories = Object.entries(matatuConfigs).map(([key, config]) => ({
        key,
        title: config.title,
    }));

    const searchResults = licensePlate.trim()
        ? await getVehiclesByCategory({ licensePlate: licensePlate.trim() })
        : null;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
                <Input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="Search by license plate (e.g., KAA 123B)"
                    className="bg-gray-800 text-white border-gray-700 placeholder-gray-500"
                />
            </div>
            {licensePlate.trim() && searchResults ? (
                <section className="mb-12">
                    <h2 className="text-3xl font-bold mb-6 text-white">
                        Search Results {searchResults.vehicles.length > 0 ? `(${searchResults.vehicles.length})` : ''}
                    </h2>
                    {searchResults.vehicles.length > 0 ? (
                        <VehicleCarousel
                            vehicles={searchResults.vehicles}
                            total={searchResults.total}
                            categoryKey="search"
                        />
                    ) : (
                        <p className="text-gray-400">No vehicles found for license plate &quot;{licensePlate}&quot;.</p>
                    )}
                </section>
            ) : (
                categories.map(({ key, title }) => (
                    <section key={key} className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 text-white">{title}</h2>
                        <VehicleCarousel categoryKey={key} />
                    </section>
                ))
            )}
        </div>
    );
}

async function VehicleCarousel({
    categoryKey,
    vehicles: propVehicles,
    total: propTotal,
}: {
    categoryKey: string;
    vehicles?: { id: string; licensePlate: string; capacity: MatatuCapacity; image: string; blurDataURL: string }[];
    total?: number;
}) {
    const pageSize = 10;
    const [page, setPage] = useState(1);

    const { vehicles, total } =
        propVehicles && propTotal !== undefined
            ? { vehicles: propVehicles, total: propTotal }
            : await getVehiclesByCategory({ categoryKey, page, pageSize });

    const totalPages = Math.ceil(total / pageSize) || 1;

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage((prev) => prev - 1);
        }
    };

    const frames: Frame[] = vehicles.map((vehicle) => ({
        key: vehicle.id,
        desktop: {
            image: {
                src: vehicle.image || '/placeholder.jpg',
                width: 320,
                height: 180,
                alt: vehicle.licensePlate,
                blurDataURL: vehicle.blurDataURL || '/placeholder.jpg',
                imageFocalPoint: { x: 160, y: 90 },
            },
            component: ({ decrementCarousel, incrementCarousel }: FrameRenderedComponentPropsWithIndex) => (
                <Link href={`/vehicles/${vehicle.id}`} className="block h-full">
                    <motion.div
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full"
                    >
                        <Card className="bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors h-full flex flex-col rounded-lg overflow-hidden">
                            <CardHeader className="p-0">
                                <Image
                                    src={vehicle.image || '/placeholder.jpg'}
                                    alt={vehicle.licensePlate}
                                    width={320}
                                    height={180}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL={vehicle.blurDataURL || '/placeholder.jpg'}
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
            ),
        },
        mobile: {
            image: {
                src: vehicle.image || '/placeholder.jpg',
                width: 320,
                height: 180,
                alt: vehicle.licensePlate,
                blurDataURL: vehicle.blurDataURL || '/placeholder.jpg',
                imageFocalPoint: { x: 160, y: 90 },
            },
            component: ({ decrementCarousel, incrementCarousel }: FrameRenderedComponentPropsWithIndex) => (
                <Link href={`/vehicles/${vehicle.id}`} className="block h-full">
                    <motion.div
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full"
                    >
                        <Card className="bg-gray-800 border-gray-700 hover:border-gray-500 transition-colors h-full flex flex-col rounded-lg overflow-hidden">
                            <CardHeader className="p-0">
                                <Image
                                    src={vehicle.image || '/placeholder.jpg'}
                                    alt={vehicle.licensePlate}
                                    width={320}
                                    height={180}
                                    className="w-full h-48 object-cover"
                                    loading="lazy"
                                    placeholder="blur"
                                    blurDataURL={vehicle.blurDataURL || '/placeholder.jpg'}
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
            ),
        },
    }));

    const ControlsComponent = ({
        decrementCarousel,
        incrementCarousel,
        jumpTo,
        currentIndex,
    }: FrameRenderedComponentPropsWithIndex) => {
        const visibleCount = useIsMobile() ? 1 : { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }['lg'];
        return (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                <button
                    onClick={decrementCarousel}
                    className="pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -left-6"
                    aria-label="Previous vehicle"
                    disabled={currentIndex === 0}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={incrementCarousel}
                    className="pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -right-6"
                    aria-label="Next vehicle"
                    disabled={currentIndex >= frames.length - visibleCount}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        );
    };

    return (
        <div>
            <NRCCarousel
                frames={frames}
                heights={{ desktop: 400, mobile: 350 }}
                breakpoint="lg"
                slideDuration={5000}
                noAutoPlay={false}
                blurQuality={30}
                ariaLabel={`Carousel of ${matatuConfigs[categoryKey].title} vehicles`}
                controlsComponent={ControlsComponent}
                willAutoPlayOutsideViewport={false}
                loadingComponent={
                    <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg" aria-busy="true" />
                }
            />
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <Button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        Previous
                    </Button>
                    <span className="text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
