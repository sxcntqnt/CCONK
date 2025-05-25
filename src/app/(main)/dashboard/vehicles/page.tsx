// src/app/(marketing)/vehicles/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { getVehiclesByCategory } from './vehicleUtils';
import { matatuConfigs, MatatuCapacity } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NRCCarousel, { Frame, FrameRenderedComponentPropsWithIndex } from '@/components/ui/NRCCarousel';
import { useIsMobile } from '@/hooks/use-mobile';

interface VehiclesPageProps {
    categories: { key: MatatuCapacity; title: string }[];
    searchResults: {
        vehicles: { id: string; licensePlate: string; capacity: MatatuCapacity; image: string; blurDataURL: string }[];
        total: number;
    } | null;
    licensePlate: string;
}

export default function VehiclesPage({ categories = [], searchResults, licensePlate = '' }: VehiclesPageProps) {
    const [searchValue, setSearchValue] = useState(licensePlate ?? '');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }, []);

    // Handle search submission
    const handleSearchSubmit = useCallback(() => {
        if (searchValue.trim()) {
            window.location.href = `/vehicles?licensePlate=${encodeURIComponent(searchValue)}`;
        }
    }, [searchValue]);

    // Keyboard navigation for search input
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Enter' && document.activeElement === searchInputRef.current) {
                handleSearchSubmit();
            }
            // Optional: Focus search input with Ctrl + /
            if (event.ctrlKey && event.key === '/') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        },
        [handleSearchSubmit],
    );

    // Window resize handling
    const handleResize = useCallback(() => {
        if (pageRef.current && searchInputRef.current) {
            // Adjust search input width or layout
            const width = window.innerWidth < 640 ? '100%' : '50%';
            searchInputRef.current.style.width = width;
        }
    }, []);

    // Scroll-based visibility
    const handleScroll = useCallback(() => {
        if (!pageRef.current) return;
        const carousels = pageRef.current.querySelectorAll('.carousel-section');
        carousels.forEach((carousel) => {
            const rect = carousel.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            (carousel as HTMLElement).style.opacity = isVisible ? '1' : '0.8';
        });
    }, []);

    // Add and clean up event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        // Initial calls
        handleResize();
        handleScroll();

        // Focus search input on mount if search is active
        if (licensePlate.trim()) {
            searchInputRef.current?.focus();
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleKeyDown, handleResize, handleScroll, licensePlate]);

    return (
        <div className="min-h-screen bg-gray-900 text-white" ref={pageRef}>
            <div className="container mx-auto px-4 py-12">
                <div className="mb-8">
                    <Input
                        ref={searchInputRef}
                        value={searchValue}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearchSubmit();
                        }}
                        onChange={handleSearchChange}
                        placeholder="Search by license plate (e.g., KAA 123B)"
                        className="bg-gray-800 text-white border-gray-700 placeholder-gray-500 search-input"
                        aria-label="Search vehicles by license plate"
                    />
                </div>
                {searchValue.trim() && searchResults ? (
                    <section className="mb-12 carousel-section">
                        <h2 className="text-3xl font-bold mb-6 text-white">
                            Search Results{' '}
                            {searchResults.vehicles.length > 0 ? `(${searchResults.vehicles.length})` : ''}
                        </h2>
                        {searchResults.vehicles.length > 0 ? (
                            <VehicleCarousel
                                categoryKey="search"
                                vehicles={searchResults.vehicles}
                                total={searchResults.total}
                            />
                        ) : (
                            <p className="text-gray-400">No vehicles found for license plate "{searchValue}".</p>
                        )}
                    </section>
                ) : (
                    categories.map(({ key, title }) => (
                        <section key={key} className="mb-12 carousel-section">
                            <h2 className="text-3xl font-bold mb-6 text-white">{title}</h2>
                            <VehicleCarousel categoryKey={key} />
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}

async function VehicleCarousel({
    categoryKey,
    vehicles: propVehicles,
    total: propTotal,
}: {
    categoryKey: MatatuCapacity | 'search';
    vehicles?: { id: string; licensePlate: string; capacity: MatatuCapacity; image: string; blurDataURL: string }[];
    total?: number;
}) {
    const pageSize = 10;
    const page = 1; // Simplified for server-side rendering; add pagination if needed

    const { vehicles, total } =
        propVehicles && propTotal !== undefined
            ? { vehicles: propVehicles, total: propTotal }
            : await getVehiclesByCategory({
                  categoryKey: categoryKey === 'search' ? undefined : categoryKey,
                  page,
                  pageSize,
              });

    const totalPages = Math.ceil(total / pageSize) || 1;

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
                    className="carousel-nav-button pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -left-6"
                    aria-label="Previous vehicle"
                    disabled={currentIndex === 0}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={incrementCarousel}
                    className="carousel-nav-button pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -right-6"
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
                ariaLabel={`Carousel of ${matatuConfigs[categoryKey === 'search' ? '14' : categoryKey].title} vehicles`}
                controlsComponent={ControlsComponent}
                willAutoPlayOutsideViewport={false}
                loadingComponent={
                    <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg" aria-busy="true" />
                }
            />
        </div>
    );
}
