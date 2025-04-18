// src/components/ui/seat-layout.tsx
'use client';
import React, { forwardRef } from 'react';
import { cn } from '@/utils';
import styles from '@/styles/seatsLayout.module.css';

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
}

export const DynamicSeatLayout = React.memo(
    forwardRef<HTMLDivElement, SeatLayoutProps>(
        ({ title, seats = {}, layout = [], onSeatClick = () => {}, className, isLoading = false }, ref) => {
            if (isLoading) return <div className={styles.loading}>Loading seats...</div>;
            if (!layout.length) return <div className={styles.error}>No seat layout available</div>;

            const seatNumberToId = new Map<number, number>();
            Object.values(seats).forEach((seat) => seatNumberToId.set(seat.seatNumber, seat.id));

            const handleSeatClick = (id: number) => {
                if (process.env.NODE_ENV === 'development') console.log('Seat clicked:', id);
                onSeatClick(id);
            };

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
                                            return (
                                                <div
                                                    key={seatNumber}
                                                    className={cn(
                                                        styles.seat,
                                                        seat?.status ? styles[seat.status] : styles.available,
                                                    )}
                                                    onClick={() => seatId && handleSeatClick(seatId)}
                                                    onKeyDown={(e) =>
                                                        seatId &&
                                                        (e.key === 'Enter' || e.key === ' ') &&
                                                        (e.preventDefault(), handleSeatClick(seatId))
                                                    }
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`Seat ${seat?.seatNumber || seatNumber} - ${seat?.status || 'available'}`}
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
            );
        },
    ),
    (prevProps, nextProps) =>
        prevProps.seats === nextProps.seats &&
        prevProps.layout === nextProps.layout &&
        prevProps.isLoading === nextProps.isLoading,
);

DynamicSeatLayout.displayName = 'DynamicSeatLayout';
