'use client';

import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import useBusReservation from '@/hooks/useReservation';
import { matatuConfigs, MatatuCapacity } from '@/utils/constants/matatuSeats';
import { DynamicSeatLayout, Seat } from '@/components/ui/seat-layout';
import { AnimationContainer, MaxWidthWrapper } from '@/components';
import { Button } from '@/components/ui/button';
import { LampContainer } from '@/components/ui/lamp';
import MagicBadge from '@/components/ui/magic-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import PhoneNumberForm from '@/components/ui/PhonNumberForm';
import Image from 'next/image';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination';
import { cn } from '@/utils';
import { ErrorBoundary } from '@/components';

/**
 * Interfaces for type safety
 */
interface Bus {
    id: number;
    licensePlate: string;
    capacity: MatatuCapacity;
    category: string;
    imageUrl?: string;
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

interface ReservationError {
    message: string;
    type: 'validation' | 'payment' | 'reservation' | 'network' | 'unknown';
    details?: string;
}

/**
 * Component to display the selected bus image
 */
const BusImageDisplay: React.FC<{ imageUrl?: string; category: string; isLoading: boolean }> = ({
    imageUrl,
    category,
    isLoading,
}) => {
    if (!imageUrl) {
        return <p className="text-gray-400 text-center">No image available for this bus</p>;
    }

    return (
        <div className="flex justify-center">
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
        </div>
    );
};

/**
 * Main ReservePage component
 */
export default function ReservePage() {
    const { user, isLoaded: userLoaded } = useUser();
    const clerkId = user?.id ?? null; // Safely handle undefined user

    const {
        buses,
        selectedBusId,
        seats,
        selectedSeats,
        total,
        phoneNumber,
        isPhoneValid,
        isLoading,
        error,
        paymentSuccess,
        paymentError,
        setPhoneNumber,
        handleBusChange,
        handleSeatClick,
        handleCheckout,
        confirmCheckout,
        handleReset,
        handleNextPage,
        handlePrevPage,
        selectedCapacity,
        handleCapacityChange,
        licensePlateFilter,
        handleLicensePlateChange,
        currentPage,
        totalPages,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
    } = useBusReservation();

    const selectedBus = buses.find((bus) => bus.id === selectedBusId) || {
        id: 0,
        licensePlate: 'N/A',
        capacity: '14' as MatatuCapacity,
        category: 'N/A',
        imageUrl: '',
    };
    const busCapacity = selectedBus.capacity;
    const layout = matatuConfigs[busCapacity as keyof typeof matatuConfigs]?.layout || matatuConfigs['14'].layout;

    const seatsForLayout: Record<number, Seat> = Object.fromEntries(
        Object.entries(seats).map(([id, seat]) => [
            parseInt(id, 10),
            {
                id: parseInt(id, 10),
                busId: selectedBusId || 0,
                seatNumber: parseInt(seat.label, 10) || 0,
                price: seat.price || 0,
                row: seat.row || 0,
                column: seat.column || 0,
                status: seat.status || 'available',
            } as Seat,
        ]),
    );

    const seatCount = Object.keys(seatsForLayout).length;

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
        } else if (paymentError) {
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
    }, [paymentSuccess, paymentError]);

    const handleConfirmCheckout = () => {
        if (!clerkId) {
            toast.error('Please sign in to complete your reservation');
            return;
        }
        confirmCheckout(clerkId);
    };

    // Show loading state while Clerk user data is loading
    if (!userLoaded) {
        return (
            <ErrorBoundary>
                <MaxWidthWrapper className="flex items-center justify-center min-h-screen">
                    <div className="text-white">Loading reservation...</div>
                </MaxWidthWrapper>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <MaxWidthWrapper className="py-6">
                <LampContainer>
                    <AnimationContainer>
                        <h1 className="text-4xl font-bold text-white text-center mb-4">Reserve Your Seat</h1>
                        <MagicBadge>Book your ride in style!</MagicBadge>
                    </AnimationContainer>
                </LampContainer>

                {error && !paymentSuccess && <ErrorMessage message={error.message || 'An error occurred'} />}

                {selectedBusId && seatCount > 0 && layout.length > 0 ? (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                            <DynamicSeatLayout
                                title={selectedBus.category}
                                seats={seatsForLayout}
                                layout={layout}
                                onSeatClick={(id: number) => handleSeatClick(id.toString())}
                                isLoading={isLoading}
                                className="mt-2"
                            />
                            <p className="text-gray-300 text-center mt-1">Seats: {seatCount}</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <BusImageDisplay
                                imageUrl={selectedBus.imageUrl}
                                category={selectedBus.category}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center mb-6">
                        {buses.length === 0
                            ? 'No buses available for the selected filters'
                            : 'Select a bus to view seat layout'}
                    </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <BusSelectionCard
                        buses={buses}
                        selectedBusId={selectedBusId}
                        handleBusChange={handleBusChange}
                        selectedBus={selectedBus}
                        isLoading={isLoading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handleNextPage={handleNextPage}
                        handlePrevPage={handlePrevPage}
                        selectedCapacity={selectedCapacity}
                        handleCapacityChange={handleCapacityChange}
                        licensePlateFilter={licensePlateFilter}
                        handleLicensePlateChange={handleLicensePlateChange}
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
                        isLoading={isLoading}
                        isPhoneValid={isPhoneValid}
                        error={error}
                    />
                </div>

                <Dialog
                    open={isCheckoutModalOpen}
                    onOpenChange={(isOpen) => {
                        if (!isLoading) {
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
                            <p>Please review your reservation details:</p>
                            <ul className="mt-2 space-y-2">
                                <li>
                                    Bus: {selectedBus.category} ({selectedBus.licensePlate})
                                </li>
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
                                disabled={isLoading}
                                className="text-white border-gray-700 w-24"
                            >
                                {paymentSuccess ? 'Close' : 'Cancel'}
                            </Button>
                            {!paymentSuccess && (
                                <Button
                                    onClick={handleConfirmCheckout}
                                    disabled={isLoading || total === 0 || !clerkId}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-48"
                                >
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </MaxWidthWrapper>
        </ErrorBoundary>
    );
}

/**
 * BookingSummaryCard component for displaying reservation details
 */
interface BookingSummaryCardProps {
    selectedSeats: string[];
    seats: Record<string, SeatData>;
    total: number;
    phoneNumber: string;
    setPhoneNumber: (value: string) => void;
    handleCheckout: () => void;
    handleReset: () => void;
    handleSeatClick: (id: string) => void;
    isLoading: boolean;
    isPhoneValid: boolean;
    error: ReservationError | null;
}

const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
    selectedSeats,
    seats,
    total,
    phoneNumber,
    setPhoneNumber,
    handleCheckout,
    handleReset,
    handleSeatClick,
    isLoading,
    isPhoneValid,
    error,
}) => {
    return (
        <Card className="bg-gray-900 text-white border-none shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Reservation Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Selected Seats:</span>
                    <MagicBadge>{selectedSeats.length.toString()}</MagicBadge>
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
                <div className="mb-6">
                    <PhoneNumberForm onValidSubmit={setPhoneNumber} defaultPhone={phoneNumber} isLoading={isLoading} />
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={handleCheckout}
                        disabled={isLoading || selectedSeats.length === 0 || !isPhoneValid || total < 20}
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
};

/**
 * BusSelectionCard component for selecting a bus
 */
interface BusSelectionCardProps {
    buses: Bus[];
    selectedBusId: number | null;
    handleBusChange: (busId: number) => void;
    selectedBus: Bus;
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    handleNextPage: () => void;
    handlePrevPage: () => void;
    selectedCapacity: MatatuCapacity | '' | 'all';
    handleCapacityChange: (capacity: MatatuCapacity | '' | 'all') => void;
    licensePlateFilter: string;
    handleLicensePlateChange: (value: string) => void;
}

const BusSelectionCard: React.FC<BusSelectionCardProps> = ({
    buses,
    selectedBusId,
    handleBusChange,
    selectedBus,
    isLoading,
    currentPage,
    totalPages,
    handleNextPage,
    handlePrevPage,
    selectedCapacity,
    handleCapacityChange,
    licensePlateFilter,
    handleLicensePlateChange,
}) => {
    return (
        <Card className="bg-gray-900 text-white border-none shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">Select Your Bus</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <label htmlFor="capacitySelect" className="text-sm text-gray-300">
                        Filter by Capacity
                    </label>
                    <Select value={selectedCapacity} onValueChange={handleCapacityChange} disabled={isLoading}>
                        <SelectTrigger
                            id="capacitySelect"
                            className="mt-1 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <SelectValue placeholder="Select capacity" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white border-gray-700">
                            <SelectItem value="all">All Capacities</SelectItem>
                            {Object.keys(matatuConfigs).map((capacity) => (
                                <SelectItem key={capacity} value={capacity}>
                                    {matatuConfigs[capacity as MatatuCapacity].title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="mb-4">
                    <label htmlFor="licensePlateInput" className="text-sm text-gray-300">
                        Search by License Plate
                    </label>
                    <Input
                        id="licensePlateInput"
                        value={licensePlateFilter}
                        onChange={(e) => handleLicensePlateChange(e.target.value)}
                        placeholder="Enter license plate (e.g., KAA 123B)"
                        disabled={isLoading}
                        className="mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                    <Button
                        variant="outline"
                        onClick={() => {
                            handleCapacityChange('all');
                            handleLicensePlateChange('');
                        }}
                        disabled={isLoading}
                        className="mt-2 text-white border-gray-700 hover:bg-gray-800 w-full"
                    >
                        Clear Filters
                    </Button>
                </div>
                <div className="mb-4">
                    <label htmlFor="busSelect" className="text-sm text-gray-300">
                        Select Bus
                    </label>
                    <select
                        id="busSelect"
                        value={selectedBusId || ''}
                        onChange={(e) => handleBusChange(parseInt(e.target.value, 10))}
                        disabled={isLoading || buses.length === 0}
                        className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {buses.length === 0 && <option value="">No buses available</option>}
                        {buses.map((bus) => (
                            <option key={bus.id} value={bus.id}>
                                {bus.category} ({bus.licensePlate})
                            </option>
                        ))}
                    </select>
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={handlePrevPage}
                                href="#"
                                className={cn(currentPage === 1 || isLoading ? 'pointer-events-none opacity-50' : '')}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-gray-300 px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={handleNextPage}
                                href="#"
                                className={cn(
                                    currentPage === totalPages || isLoading ? 'pointer-events-none opacity-50' : '',
                                )}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardContent>
        </Card>
    );
};

/**
 * ErrorMessage component for displaying error messages
 */
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>{message}</span>
    </div>
);
