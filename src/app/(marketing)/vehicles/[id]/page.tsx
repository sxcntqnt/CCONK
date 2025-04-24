'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getBus } from '@/lib/prisma/dbClient';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VehicleImagesCarousel from '@/components/ui/vehicleImagesCarousel';

// Define valid capacities based on matatuConfigs keys
type MatatuCapacity = keyof typeof matatuConfigs;

interface VehicleDetailsPageProps {
    params: { id: string };
}

export default function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
    const busId = parseInt(params.id, 10);
    const router = useRouter();
    const [bus, setBus] = useState<{
        id: number;
        licensePlate: string;
        capacity: MatatuCapacity;
        category: string;
        images: { src: string; blurDataURL?: string | null; alt: string }[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Fetch bus data client-side
    useEffect(() => {
        if (isNaN(busId)) {
            setError('Invalid bus ID');
            return;
        }

        async function fetchBus() {
            try {
                const busData = await getBus(busId);
                if (!busData) {
                    setError('Bus not found');
                } else {
                    setBus(busData);
                }
            } catch (err) {
                console.error('Error fetching bus details:', err);
                setError('Failed to load bus details');
            }
        }

        fetchBus();
    }, [busId]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'c') {
                // Focus the carousel
                event.preventDefault();
                const carousel = cardRef.current?.querySelector('.carousel-container');
                if (carousel instanceof HTMLElement) {
                    carousel.focus();
                }
            } else if (event.key === 'Escape') {
                // Navigate back
                router.back();
            }
        },
        [router],
    );

    // Window resize handling
    const handleResize = useCallback(() => {
        if (cardRef.current) {
            // Adjust card width (e.g., 90% on mobile, 75% on desktop)
            const width = window.innerWidth < 768 ? '90%' : '75%';
            cardRef.current.style.width = width;
            cardRef.current.style.margin = '0 auto';
        }
    }, []);

    // Scroll-based visibility
    const handleScroll = useCallback(() => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        cardRef.current.style.opacity = isVisible ? '1' : '0.8';
    }, []);

    // Add and clean up event listeners
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        // Initial calls
        handleResize();
        handleScroll();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleKeyDown, handleResize, handleScroll]);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (!bus) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    const busCapacity = bus.capacity;
    const config = matatuConfigs[busCapacity];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <Card
                    className="bg-gray-800 border-gray-700 rounded-lg"
                    ref={cardRef}
                    aria-label={`Details for ${bus.licensePlate}`}
                >
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
                        <p className="text-sm text-gray-300">Category: {bus.category}</p>
                    </CardHeader>
                    <CardContent>
                        <VehicleImagesCarousel
                            images={bus.images}
                            licensePlate={bus.licensePlate}
                            className="carousel-container"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
