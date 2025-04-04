// src/components/ui/seat-layout.tsx
'use client';
import React, { forwardRef } from 'react';
import { cn } from '@/utils';
import styles from '@/styles/seatsLayout.module.css';

interface Seat {
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
    seats?: Record<number, Seat>; // Made optional with default in destructuring
    layout?: number[][][]; // Made optional with default in destructuring
    onSeatClick?: (id: number) => void; // Made optional with default in destructuring
    isLoading?: boolean; // Made optional with default in destructuring
    className?: string;
}

export const DynamicSeatLayout = React.memo(
    forwardRef<HTMLDivElement, SeatLayoutProps>(
        (
            {
                title,
                seats = {}, // Default value here
                layout = [], // Default value here
                onSeatClick = () => {}, // Default value here
                className,
                isLoading = false, // Default value here
            },
            ref,
        ) => {
            console.log('DynamicSeatLayout Props:', { seats, layout, isLoading });

            const handleSeatClick = (id: number) => {
                console.log('Seat clicked:', id);
                onSeatClick(id);
            };
            const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>, id: number) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSeatClick(id);
                }
            };

            if (isLoading) return <div className={styles.loading}>Loading seats...</div>;
            if (!layout.length) return <div className={styles.error}>No seat layout available</div>;

            // Map seatNumber to database ID
            const seatNumberToId = new Map<number, number>();
            Object.values(seats).forEach((seat) => {
                seatNumberToId.set(seat.seatNumber, seat.id);
            });
            console.log('seatNumberToId:', Array.from(seatNumberToId.entries()));

            return (
                <div className={cn(styles.matatuContainer, className)} ref={ref}>
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.seatGrid}>
                        {layout.map((row, rowIndex) => (
                            <div key={rowIndex} className={styles.seatRow}>
                                {row.map((group, groupIndex) => (
                                    <React.Fragment key={groupIndex}>
                                        {group.map((seatNumber) => {
                                            const seatId = seatNumberToId.get(seatNumber);
                                            const seat = seatId !== undefined ? seats[seatId] : undefined;
                                            console.log(`Rendering seat ${seatNumber}:`, { seatId, seat });
                                            return (
                                                <div
                                                    key={seatNumber}
                                                    className={cn(
                                                        styles.seat,
                                                        seat?.status ? styles[seat.status] : styles.available,
                                                    )}
                                                    onClick={() => seatId && handleSeatClick(seatId)}
                                                    onKeyDown={(e) => seatId && handleKeyPress(e, seatId)}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`Seat ${seat?.seatNumber || seatNumber} - ${seat?.status || 'available'}`}
                                                >
                                                    {seat?.seatNumber || seatNumber}
                                                </div>
                                            );
                                        })}
                                        {/* Add aisle between groups if not the last group */}
                                        {groupIndex < row.length - 1 && <div className={styles.aisleSpace} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <div className={cn(styles.seat, styles.available)} aria-hidden="true" />
                            <span>Available</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={cn(styles.seat, styles.selected)} aria-hidden="true" />
                            <span>Selected</span>
                        </div>
                        <div className={styles.legendItem}>
                            <div className={cn(styles.seat, styles.reserved)} aria-hidden="true" />
                            <span>Reserved</span>
                        </div>
                    </div>
                </div>
            );
        },
    ),
    (prevProps, nextProps) =>
        JSON.stringify(prevProps.seats) === JSON.stringify(nextProps.seats) &&
        JSON.stringify(prevProps.layout) === JSON.stringify(nextProps.layout) &&
        prevProps.isLoading === nextProps.isLoading,
);

DynamicSeatLayout.displayName = 'DynamicSeatLayout';
