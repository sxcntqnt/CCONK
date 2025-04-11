// src/app/(reservation)/reserve/useReservation.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSeats, getBuses, reserveSeats, resetReservations } from '@/lib/prisma/dbClient';
import { validatePhonePrefix } from '@/utils/constants/phone-constants';
import { useStkPush } from '@/hooks/use-mpesa';
import { toast } from 'sonner';

interface StkPushResponse {
    CheckoutRequestID: string;
}

interface StkPushQueryData {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
    ResultCode: string;
    ResultDesc: string;
    CallbackMetadata?: {
        Item: Array<{
            Name: string;
            Value?: string | number;
        }>;
    };
}

interface StkPushResult {
    data?: StkPushResponse;
    error?: string;
}

interface Bus {
    id: number;
    licensePlate: string;
    capacity: number;
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

const useBusReservation = () => {
    const [buses, setBuses] = useState<Bus[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
    const [seats, setSeats] = useState<Record<string, SeatData>>({});
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [phoneNumber, setPhoneNumber] = useState<string>('+254 ');
    const [error, setError] = useState<ReservationError | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalBuses, setTotalBuses] = useState<number>(0);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
    const pageSize = 10;

    const {
        initiatePayment,
        isLoading: paymentLoading,
        stkQueryLoading,
        paymentSuccess,
        paymentError,
        paymentData,
        reset: resetPayment,
    } = useStkPush() || {
        initiatePayment: async () => (({
            error: 'Payment hook unavailable'
        }) as StkPushResult),
        isLoading: false,
        stkQueryLoading: false,
        paymentSuccess: false,
        paymentError: null,
        paymentData: null,
        reset: () => {},
    };

    const total = useMemo(() => {
        try {
            return selectedSeats.reduce((sum, id) => sum + (seats[id]?.price || 0), 0);
        } catch (err) {
            console.error('Error calculating total:', err);
            return 0;
        }
    }, [selectedSeats, seats]);

    const fetchBuses = useCallback(
        async (page: number) => {
            try {
                const { buses: busData, total } = await getBuses(page, pageSize);
                if (!busData || !Array.isArray(busData)) {
                    throw new Error('Invalid bus data received');
                }
                if (busData.length === 0 && total === 0) {
                    setError({ message: 'No buses found in the system', type: 'validation' });
                    toast.error('No buses available');
                } else {
                    setBuses(busData);
                    setTotalBuses(total || 0);
                    if (busData.length > 0 && selectedBusId === null) {
                        setSelectedBusId(busData[0].id);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load buses';
                setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
                toast.error(message);
                console.error('fetchBuses error:', err);
            }
        },
        [selectedBusId],
    );

    useEffect(() => {
        fetchBuses(currentPage);
    }, [currentPage, fetchBuses]);

    const loadSeats = useCallback(async () => {
        if (selectedBusId === null) {
            setError({ message: 'No bus selected', type: 'validation' });
            toast.error('No bus selected');
            return;
        }

        try {
            const seatData = await getSeats(selectedBusId);
            if (!seatData || typeof seatData !== 'object') {
                throw new Error('Invalid seat data received');
            }
            if (Object.keys(seatData).length === 0) {
                throw new Error('No seats available for this bus');
            }
            setSeats(seatData);
            setSelectedSeats([]);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch seats';
            setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
            toast.error(message);
            console.error('loadSeats error:', err);
        }
    }, [selectedBusId]);

    useEffect(() => {
        loadSeats();
    }, [loadSeats]);

    const handleBusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newBusId = parseInt(e.target.value, 10);
        if (isNaN(newBusId)) {
            setError({ message: 'Invalid bus selection', type: 'validation' });
            toast.error('Invalid bus selection');
            return;
        }
        setSelectedBusId(newBusId);
    };

    const handleSeatClick = (id: string) => {
        const seat = seats[id];
        if (!seat) {
            setError({ message: `Seat ${id} not found`, type: 'validation' });
            toast.error(`Seat ${id} not found`);
            return;
        }
        if (seat.status === 'reserved') {
            toast.info('This seat is already reserved');
            return;
        }

        const newStatus = seat.status === 'available' ? 'selected' : 'available';
        setSeats((prevSeats) => ({
            ...prevSeats,
            [id]: { ...seat, status: newStatus },
        }));
        setSelectedSeats((prev) => (newStatus === 'selected' ? [...prev, id] : prev.filter((seatId) => seatId !== id)));
    };

    const handleCheckout = () => {
        if (selectedSeats.length === 0 || !selectedBusId) {
            setError({ message: 'Please select a bus and at least one seat', type: 'validation' });
            toast.error('Please select a bus and at least one seat');
            return;
        }

        if (phoneNumber === '+254 ' || phoneNumber.length <= 5) {
            setError({ message: 'Invalid phone number', type: 'validation' });
            toast.error('Please enter a valid phone number');
            return;
        }

        if (total <= 0) {
            setError({ message: 'Total amount must be greater than zero', type: 'validation' });
            toast.error('Total amount must be greater than zero');
            return;
        }

        setIsCheckoutModalOpen(true);
    };

    const confirmCheckout = useCallback(async () => {
        const normalizedPhone = phoneNumber.trim().replace(/[\s,-]/g, '');
        const validationResult = validatePhonePrefix(normalizedPhone);

        if (!validationResult.isValid) {
            setError({
                message: validationResult.errorMessage || 'Invalid phone number format',
                type: 'validation',
            });
            toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., +254 7XX...)');
            setIsCheckoutModalOpen(false);
            return;
        }

        try {
            if (paymentLoading || stkQueryLoading) {
                toast.error('Payment already in progress');
                throw new Error('Payment already in progress');
            }

            console.log('Initiating payment with:', {
                phoneNumber: normalizedPhone,
                totalAmount: total,
                name: 'Customer',
            });

            const paymentResult = await initiatePayment({
                phoneNumber: normalizedPhone,
                totalAmount: total,
                name: 'Customer',
            });

            if (!paymentResult) {
                toast.error('Payment initiation failed: No response received');
                throw new Error('Payment initiation returned no response');
            }

            if ('error' in paymentResult) {
                toast.error(paymentResult.error);
                throw new Error(paymentResult.error);
            }

            const stkData = paymentResult.data;
            if (!stkData || !stkData.CheckoutRequestID) {
                toast.error('Payment initiation failed: No CheckoutRequestID received');
                throw new Error('Payment initiation failed: No CheckoutRequestID received');
            }

            toast.info('Payment initiated. Please check your phone to complete the STK push.');

            const paymentTimeout = setTimeout(() => {
                if (!paymentData && !paymentError) {
                    setError({ message: 'Payment processing timed out', type: 'payment' });
                    toast.error('Payment processing timed out. Please try again.');
                    resetPayment();
                }
            }, 30000);

            while (!paymentData && !paymentError && (paymentLoading || stkQueryLoading)) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            clearTimeout(paymentTimeout);

            if (paymentError) {
                toast.error(paymentError);
                throw new Error(paymentError);
            }

            if (!paymentData) {
                toast.error('Payment confirmation failed: No data received');
                throw new Error('Payment confirmation failed: No data received');
            }

            if (paymentData.ResultCode !== '0') {
                toast.error(paymentData.ResultDesc || 'Payment failed');
                throw new Error(paymentData.ResultDesc || 'Payment failed');
            }

            const reservationResult = await reserveSeats(selectedSeats);
            if (!reservationResult.success) {
                toast.error(reservationResult.error || 'Reservation failed');
                throw new Error(reservationResult.error || 'Reservation failed');
            }

            setSeats((prev) => {
                const updatedSeats = { ...prev };
                selectedSeats.forEach((id) => {
                    updatedSeats[id] = { ...updatedSeats[id], status: 'reserved' };
                });
                return updatedSeats;
            });

            setSelectedSeats([]);
            toast.success(
                `Payment confirmed! Reserved ${reservationResult.reservedCount} seats. ${paymentData.CustomerMessage}`,
            );
            setIsCheckoutModalOpen(false);
            resetPayment();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Checkout failed';
            let errorType: ReservationError['type'] = 'unknown';
            let details: string | undefined;

            if (errorMessage.includes('payment') || errorMessage.includes('STK')) {
                errorType = 'payment';
            } else if (errorMessage.includes('reservation')) {
                errorType = 'reservation';
            } else if (err instanceof Error && err.message.includes('network')) {
                errorType = 'network';
                details = err.stack;
            }

            setError({ message: errorMessage, type: errorType, details });
            setIsCheckoutModalOpen(false);
            console.error('confirmCheckout error:', err);
        }
    }, [
        phoneNumber,
        total,
        selectedSeats,
        initiatePayment,
        paymentData,
        paymentError,
        paymentLoading,
        stkQueryLoading,
        resetPayment,
    ]);
    const handleReset = async () => {
        if (!selectedBusId) {
            setError({ message: 'No bus selected to reset', type: 'validation' });
            toast.error('Please select a bus to reset');
            return;
        }
        if (!confirm('Are you sure you want to reset all reservations for this bus?')) return;

        try {
            const resetResult = await resetReservations(selectedBusId);
            if (!resetResult.success) {
                toast.error(resetResult.error || 'Reset failed');
                throw new Error(resetResult.error || 'Reset failed');
            }
            await loadSeats();
            setSelectedSeats([]);
            setPhoneNumber('+254 ');
            resetPayment();
            toast.success(`Cleared ${resetResult.deletedCount} reservations successfully`);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Reset failed';
            setError({
                message: errorMessage,
                type: 'reservation',
                details: err instanceof Error ? err.stack : undefined,
            });
            toast.error(errorMessage);
            console.error('handleReset error:', err);
        }
    };

    const handleNextPage = () => {
        if (currentPage * pageSize < totalBuses) {
            setCurrentPage((prev) => prev + 1);
        } else {
            toast.info('No more pages available');
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        } else {
            toast.info('Already on the first page');
        }
    };

    return {
        buses,
        selectedBusId,
        seats,
        selectedSeats,
        total,
        phoneNumber,
        isLoading: paymentLoading || stkQueryLoading,
        error,
        setError,
        currentPage,
        totalPages: Math.ceil(totalBuses / pageSize) || 1,
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
        paymentSuccess,
        paymentError,
    };
};

export default useBusReservation;
