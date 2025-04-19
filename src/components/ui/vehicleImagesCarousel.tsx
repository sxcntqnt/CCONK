// src/components/VehicleImagesCarousel.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import NRCCarousel, { Frame, FrameRenderedComponentPropsWithIndex } from './NRCCarousel';
import { useIsMobile } from '@/hooks/use-mobile';

type VehicleImage = {
    src: string;
    blurDataURL: string;
    alt: string;
};

type VehicleImagesCarouselProps = {
    images: VehicleImage[];
    licensePlate: string;
};

export default function VehicleImagesCarousel({ images, licensePlate }: VehicleImagesCarouselProps) {
    const frames: Frame[] = images.map((image, index) => ({
        key: `${licensePlate}-${index}`,
        desktop: {
            image: {
                src: image.src,
                width: 800, // Larger viewport
                height: 450, // 16:9 aspect ratio
                alt: image.alt,
                blurDataURL: image.blurDataURL,
                imageFocalPoint: { x: 400, y: 225 },
            },
            component: ({ decrementCarousel, incrementCarousel }: FrameRenderedComponentPropsWithIndex) => (
                <motion.div
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-full"
                >
                    <Card className="bg-gray-800 border-gray-700 transition-colors h-full flex flex-col rounded-lg overflow-hidden">
                        <CardHeader className="p-0">
                            <Image
                                src={image.src}
                                alt={image.alt}
                                width={800}
                                height={450}
                                className="w-full h-[400px] object-cover"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL={image.blurDataURL}
                            />
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col items-center justify-center flex-grow">
                            <p className="text-sm text-gray-300">{image.alt}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ),
        },
        mobile: {
            image: {
                src: image.src,
                width: 600, // Slightly smaller for mobile
                height: 337.5,
                alt: image.alt,
                blurDataURL: image.blurDataURL,
                imageFocalPoint: { x: 300, y: 168.75 },
            },
            component: ({ decrementCarousel, incrementCarousel }: FrameRenderedComponentPropsWithIndex) => (
                <motion.div
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-full"
                >
                    <Card className="bg-gray-800 border-gray-700 transition-colors h-full flex flex-col rounded-lg overflow-hidden">
                        <CardHeader className="p-0">
                            <Image
                                src={image.src}
                                alt={image.alt}
                                width={600}
                                height={337.5}
                                className="w-full h-[300px] object-cover"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL={image.blurDataURL}
                            />
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col items-center justify-center flex-grow">
                            <p className="text-sm text-gray-300">{image.alt}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ),
        },
    }));

    const ControlsComponent = ({
        decrementCarousel,
        incrementCarousel,
        jumpTo,
        currentIndex,
    }: FrameRenderedComponentPropsWithIndex) => {
        const visibleCount = useIsMobile() ? 1 : { xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }['lg'];
        return (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                <button
                    onClick={decrementCarousel}
                    className="pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -left-6"
                    aria-label="Previous image"
                    disabled={currentIndex === 0}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={incrementCarousel}
                    className="pointer-events-auto hidden sm:flex bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full -right-6"
                    aria-label="Next image"
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
        <NRCCarousel
            frames={frames}
            heights={{ desktop: 550, mobile: 400 }} // Larger viewport
            breakpoint="lg"
            slideDuration={5000}
            noAutoPlay={false}
            blurQuality={30}
            ariaLabel={`Images of vehicle ${licensePlate}`}
            controlsComponent={ControlsComponent}
            willAutoPlayOutsideViewport={false}
            loadingComponent={
                <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg" aria-busy="true" />
            }
        />
    );
}
