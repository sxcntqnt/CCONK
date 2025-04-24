// src/components/ui/seat-layout.tsx
'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils';
import styles from '@/styles/seatsLayout.module.css';
import Image from 'next/image';
import { toast } from 'sonner';

export interface Seat {
    id: number;
    busId: number;
    seatNumber: number;
    price: number;
    row: number;
    column: number;
    status: 'available' | 'selected' | 'reserved';
}

interface SeatLayoutProps {
    title: string;
    seats?: Record<number, Seat>;
    layout?: number[][][];
    onSeatClick?: (id: number) => void;
    isLoading?: boolean;
    className?: string;
    imageUrl?: string;
    category?: string;
}

export const DynamicSeatLayout = React.memo(
    forwardRef<HTMLDivElement, SeatLayoutProps>(
        (
            {
                title,
                seats = {},
                layout = [],
                onSeatClick = () => {},
                className,
                isLoading = false,
                imageUrl,
                category = 'Bus',
            },
            ref,
        ) => {
            if (isLoading) return <div className={styles.loading}>Loading seats...</div>;
            if (!layout.length) return <div className={styles.error}>No seat layout available</div>;

            const seatNumberToId = new Map<number, number>();
            Object.values(seats).forEach((seat) => seatNumberToId.set(seat.seatNumber, seat.id));

            const handleSeatClick = (id: number) => {
                if (process.env.NODE_ENV === 'development') console.log('Seat clicked:', id);
                onSeatClick(id);
            };

            return (
                <div className={cn('mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start', className)} ref={ref}>
                    <div className={cn(styles.matatuContainer)}>
                        <h2 className={styles.title}>{title}</h2>
                        <div className={styles.seatGrid}>
                            {layout.map((row, rowIndex) => (
                                <div key={rowIndex} className={styles.seatRow}>
                                    {row.map((group, groupIndex) => (
                                        <React.Fragment key={groupIndex}>
                                            {group.map((seatNumber) => {
                                                const seatId = seatNumberToId.get(seatNumber);
                                                const seat = seatId !== undefined ? seats[seatId] : undefined;
                                                return (
                                                    <div
                                                        key={seatNumber}
                                                        data-seat-id={seatId}
                                                        className={cn(
                                                            styles.seat,
                                                            seat?.status ? styles[seat.status] : styles.available,
                                                        )}
                                                        onClick={() =>
                                                            seatId &&
                                                            seat?.status !== 'reserved' &&
                                                            handleSeatClick(seatId)
                                                        }
                                                        onKeyDown={(e) =>
                                                            seatId &&
                                                            seat?.status !== 'reserved' &&
                                                            (e.key === 'Enter' || e.key === ' ') &&
                                                            (e.preventDefault(), handleSeatClick(seatId))
                                                        }
                                                        role="button"
                                                        tabIndex={seat?.status === 'reserved' ? -1 : 0}
                                                        aria-label={`Seat ${seat?.seatNumber || seatNumber} - ${seat?.status || 'available'}`}
                                                        aria-disabled={seat?.status === 'reserved'}
                                                    >
                                                        {seat?.seatNumber || seatNumber}
                                                    </div>
                                                );
                                            })}
                                            {groupIndex < row.length - 1 && <div className={styles.aisleSpace} />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className={styles.legend}>
                            {['available', 'selected', 'reserved'].map((status) => (
                                <div key={status} className={styles.legendItem}>
                                    <div className={cn(styles.seat, styles[status])} aria-hidden="true" />
                                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={category}
                                width={192}
                                height={192}
                                className="object-cover rounded-md"
                                placeholder="blur"
                                blurDataURL="/placeholder.jpg"
                                priority={false}
                                onLoadingComplete={() => console.log(`Loaded image for ${category}`)}
                                onError={() => toast.error(`Failed to load image for ${category}`)}
                            />
                        ) : (
                            <p className="text-gray-400 text-center">No image available for this bus</p>
                        )}
                    </div>
                </div>
            );
        },
    ),
    (prevProps, nextProps) =>
        prevProps.seats === nextProps.seats &&
        prevProps.layout === nextProps.layout &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.imageUrl === nextProps.imageUrl &&
        prevProps.category === nextProps.category,
);

DynamicSeatLayout.displayName = 'DynamicSeatLayout';
