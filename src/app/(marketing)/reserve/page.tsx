// src/app/(reservation)/reserve/page.tsx
'use client';

import React, { useEffect, Component } from 'react';
import useBusReservation from './useReservation';
import { matatuConfigs } from '@/utils/constants/matatuSeats';
import { DynamicSeatLayout } from '@/components/ui/seat-layout';
import { AnimationContainer, MaxWidthWrapper } from '@/components';
import { Button } from '@/components/ui/button';
import { LampContainer } from '@/components/ui/lamp';
import MagicBadge from '@/components/ui/magic-badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type MatatuCapacity = keyof typeof matatuConfigs;
interface Bus {
    id: number;
    licensePlate: string;
    capacity: MatatuCapacity;
}

interface SeatData {
    id: string;
    label: string;
    status: 'available' | 'selected' | 'reserved';
    price: number;
    row?: number;
    column?: number;
    category?: string;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
    state = { hasError: false, error: '' };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error: error.message };
    }

    render() {
        if (this.state.hasError) {
            return <div className="text-red-500 p-4">Error: {this.state.error}</div>;
        }
        return this.props.children;
    }
}

export default function ReservePage() {
    const {
        buses: reservationBuses,
        selectedBusId,
        seats,
        selectedSeats,
        total,
        phoneNumber,
        isLoading: combinedLoading,
        error: combinedError,
        paymentSuccess,
        paymentError,
        setError,
        currentPage,
        totalPages,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        setPhoneNumber,
        handleBusChange,
        handleSeatClick,
        handleCheckout,
        confirmCheckout,
        handleReset,
        handleNextPage,
        handlePrevPage,
    } = useBusReservation();

    const buses: Bus[] = (reservationBuses || []).map((bus) => ({
        id: bus.id,
        licensePlate: bus.licensePlate || 'N/A',
        capacity: (bus.capacity || 14) as MatatuCapacity,
    }));

    const selectedBus = buses.find((bus) => bus.id === selectedBusId) || {
        id: 0,
        licensePlate: 'N/A',
        capacity: 14 as MatatuCapacity,
    };
    const busCapacity = selectedBus.capacity;
    const layout = matatuConfigs[busCapacity]?.layout || [];

    const seatsForLayout = Object.fromEntries(
        Object.entries(seats || {}).map(([id, seat]) => [
            id,
            {
                id: id,
                busId: selectedBusId || 0,
                seatNumber: parseInt(seat.label, 10) || 0,
                price: seat.price || 0,
                row: seat.row || 0,
                column: seat.column || 0,
                status: seat.status || 'available',
            },
        ]),
    );

    useEffect(() => {
        if (paymentSuccess) {
            toast.success(
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Payment successful! Your seats are reserved.</span>
                </div>,
                {
                    duration: 5000,
                    style: {
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        color: '#fff',
                    },
                },
            );
        }
    }, [paymentSuccess]);

    useEffect(() => {
        if (paymentError) {
            toast.error(
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span>{paymentError}</span>
                </div>,
                {
                    duration: 5000,
                    style: {
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fff',
                    },
                },
            );
        }
    }, [paymentError]);

    console.log('ReservePage - Data:', {
        busesLength: buses.length,
        selectedBusId,
        seatsKeys: Object.keys(seats),
        seatsForLayoutKeys: Object.keys(seatsForLayout),
        total,
        phoneNumber,
        combinedError,
        paymentSuccess,
        paymentError,
    });

    return (
        <ErrorBoundary>
            <MaxWidthWrapper className="py-6">
                <LampContainer>
                    <AnimationContainer>
                        <h1 className="text-4xl font-bold text-white text-center mb-4">Reserve Your Seat</h1>
                        <MagicBadge title="Book your ride in style!" />
                    </AnimationContainer>
                </LampContainer>

                {combinedError && !paymentSuccess && (
                    <ErrorMessage message={combinedError.message || 'An error occurred'} />
                )}

                {selectedBusId && Object.keys(seatsForLayout).length > 0 && layout.length > 0 ? (
                    <div className="mb-6">
                        <DynamicSeatLayout
                            title={selectedBus.licensePlate}
                            seats={seatsForLayout}
                            layout={layout}
                            onSeatClick={handleSeatClick}
                            isLoading={combinedLoading}
                            className="mt-2"
                        />
                        <p className="text-gray-300 text-center mt-1">Seats: {Object.keys(seatsForLayout).length}</p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center mb-6">
                        {buses.length === 0 ? 'No buses available' : 'Select a bus to view seat layout'}
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <BusSelectionCard
                        buses={buses}
                        selectedBusId={selectedBusId}
                        handleBusChange={handleBusChange}
                        selectedBus={selectedBus}
                        isLoading={combinedLoading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handleNextPage={handleNextPage}
                        handlePrevPage={handlePrevPage}
                    />
                    <BookingSummaryCard
                        selectedSeats={selectedSeats}
                        seats={seats}
                        total={total}
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                        handleCheckout={handleCheckout}
                        handleReset={handleReset}
                        handleSeatClick={handleSeatClick}
                        isLoading={combinedLoading}
                    />
                </div>

                <Dialog
                    open={isCheckoutModalOpen}
                    onOpenChange={(isOpen) => {
                        if (!combinedLoading) {
                            setError(null);
                            setIsCheckoutModalOpen(isOpen);
                            if (!isOpen && paymentSuccess) {
                                handleReset();
                            }
                        }
                    }}
                >
                    <DialogContent className="bg-gray-900 text-white border-none">
                        <DialogHeader>
                            <DialogTitle>Confirm Your Reservation</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>Please review your Reservation details:</p>
                            <ul className="mt-2 space-y-2">
                                <li>Bus: {selectedBus.licensePlate}</li>
                                <li>Seats: {selectedSeats.map((id) => seats[id]?.label || id).join(', ') || 'None'}</li>
                                <li>Total: {total}/=</li>
                                <li>Phone: {phoneNumber}</li>
                            </ul>
                            {paymentSuccess && (
                                <p className="mt-4 text-green-500 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Payment confirmed successfully!
                                </p>
                            )}
                            {paymentError && (
                                <p className="mt-4 text-red-500 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    {paymentError}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="flex justify-end gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCheckoutModalOpen(false)}
                                disabled={combinedLoading}
                                className="text-white border-gray-700 w-24"
                            >
                                {paymentSuccess ? 'Close' : 'Cancel'}
                            </Button>
                            {!paymentSuccess && (
                                <Button
                                    onClick={confirmCheckout}
                                    disabled={combinedLoading || total === 0}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-48"
                                >
                                    {combinedLoading ? 'Processing...' : 'Confirm'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </MaxWidthWrapper>
        </ErrorBoundary>
    );
}

// ErrorMessage, BusSelectionCard, and BookingSummaryCard remain unchanged
// Add SeatData type to BookingSummaryCard props
const BookingSummaryCard = ({
    selectedSeats,
    seats,
    total,
    phoneNumber,
    setPhoneNumber,
    handleCheckout,
    handleReset,
    handleSeatClick,
    isLoading,
}: {
    selectedSeats: string[];
    seats: Record<string, SeatData>;
    total: number;
    phoneNumber: string;
    setPhoneNumber: (value: string) => void;
    handleCheckout: () => void;
    handleReset: () => void;
    handleSeatClick: (id: string) => void;
    isLoading: boolean;
}) => (
    <Card className="bg-gray-900 text-white border-none shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl">Reservation Summary</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <span className="text-lg">Selected Seats:</span>
                <MagicBadge title={selectedSeats.length.toString()} />
            </div>
            <ScrollArea className="h-40 mb-4">
                {selectedSeats.length > 0 ? (
                    selectedSeats.map((id) => (
                        <div key={id} className="flex justify-between items-center py-2">
                            <span>Seat #{seats[id]?.label || id}</span>
                            <div className="flex items-center gap-2">
                                <span>{seats[id]?.price || 0}/=</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSeatClick(id)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No seats selected yet.</p>
                )}
            </ScrollArea>
            <Separator className="my-4 bg-gray-700" />
            <div className="flex justify-between items-center mb-4">
                <span className="text-lg">Total:</span>
                <span className="text-xl font-bold">{total}/=</span>
            </div>
            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300">+254 </span>
                <Input
                    type="text"
                    placeholder="712345678"
                    value={phoneNumber.slice(5)}
                    onChange={(e) => setPhoneNumber('+254 ' + e.target.value.replace(/^0+/, ''))}
                    disabled={isLoading}
                    className="pl-14 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
            </div>
            <div className="flex gap-4">
                <Button
                    onClick={handleCheckout}
                    disabled={isLoading || selectedSeats.length === 0}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                    {isLoading ? 'Processing...' : 'Checkout'}
                </Button>
                <Button onClick={handleReset} variant="destructive" disabled={isLoading} className="flex-1">
                    Reset
                </Button>
            </div>
        </CardContent>
    </Card>
);

const BusSelectionCard = ({
    buses,
    selectedBusId,
    handleBusChange,
    selectedBus,
    isLoading,
    currentPage,
    totalPages,
    handleNextPage,
    handlePrevPage,
}: {
    buses: Bus[];
    selectedBusId: number | null;
    handleBusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    selectedBus: Bus;
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    handleNextPage: () => void;
    handlePrevPage: () => void;
}) => (
    <Card className="bg-gray-900 text-white border-none shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">Select Your Bus</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
                <label htmlFor="busSelect" className="text-sm text-gray-300">
                    Select Bus
                </label>
                <select
                    id="busSelect"
                    value={selectedBusId || ''}
                    onChange={handleBusChange}
                    disabled={isLoading || buses.length === 0}
                    className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {buses.length === 0 && <option value="">No buses available</option>}
                    {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                            {bus.licensePlate} - {bus.capacity} Seats
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex justify-between items-center">
                <Button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || isLoading}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    Previous
                </Button>
                <span className="text-gray-300">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoading}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    Next
                </Button>
            </div>
        </CardContent>
    </Card>
);

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>{message}</span>
    </div>
);
