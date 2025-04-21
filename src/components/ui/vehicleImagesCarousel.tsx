// src/components/VehicleImagesCarousel.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

type VehicleImage = {
    src: string;
    blurDataURL?: string | null;
    alt: string;
};

type VehicleImagesCarouselProps = {
    images: VehicleImage[];
    licensePlate: string;
};

export default function VehicleImagesCarousel({ images, licensePlate }: VehicleImagesCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Navigate to previous image
    const goToPrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    // Navigate to next image
    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    // Handle direct navigation using dots
    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <p>No images available for this vehicle</p>
            </div>
        );
    }

    return (
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <div className="w-full">
                {/* Instagram-style gallery */}
                <div className="relative overflow-hidden">
                    {/* Main image display */}
                    <div className="aspect-square sm:aspect-[4/3] relative">
                        {images.map((image, index) => (
                            <motion.div
                                key={`${licensePlate}-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: index === currentIndex ? 1 : 0,
                                    zIndex: index === currentIndex ? 10 : 0,
                                }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt || `${licensePlate} view ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    placeholder={image.blurDataURL ? 'blur' : 'empty'}
                                    blurDataURL={image.blurDataURL || undefined}
                                    sizes="(max-width: 768px) 100vw, 800px"
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Navigation arrows - only show if more than one image */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goToPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-2 text-white hover:bg-black/50 transition-colors"
                                aria-label="Previous image"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-2 text-white hover:bg-black/50 transition-colors"
                                aria-label="Next image"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Image counter */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {currentIndex + 1}/{images.length}
                    </div>

                    {/* Navigation dots */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToImage(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    index === currentIndex ? 'bg-white' : 'bg-gray-500'
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Instagram-like engagement section */}
                <CardContent className="px-4 py-3">
                    <div className="flex items-center space-x-4 pb-2">
                        <button className="text-white hover:text-gray-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </button>
                        <button className="text-white hover:text-gray-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </button>
                        <button className="text-white hover:text-gray-300">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                            </svg>
                        </button>
                        <div className="ml-auto text-xs text-gray-400">License: {licensePlate}</div>
                    </div>

                    <div className="text-sm">
                        <p className="text-gray-300">
                            {images[currentIndex]?.alt || `Vehicle view ${currentIndex + 1}`}
                        </p>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
