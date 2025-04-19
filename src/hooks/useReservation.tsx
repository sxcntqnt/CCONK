// src/hooks/useReservation.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSeats, getBuses, reserveSeats, resetReservations } from '@/lib/prisma/dbClient';
import { validatePhonePrefix } from '@/utils/constants/phone-constants';
import { useStkPush } from '@/hooks/use-mpesa';
import { toast } from 'sonner';
import { debounce } from 'lodash';

type MatatuCapacity = '14' | '26' | '33' | '46' | '52' | '67';

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

interface PhoneValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

interface UseBusReservationReturn {
    buses: Bus[];
    selectedBusId: number | null;
    seats: Record<string, SeatData>;
    selectedSeats: string[];
    total: number;
    phoneNumber: string;
    isPhoneValid: boolean;
    isLoading: boolean;
    error: ReservationError | null;
    setError: (error: ReservationError | null) => void;
    currentPage: number;
    totalPages: number;
    isCheckoutModalOpen: boolean;
    setIsCheckoutModalOpen: (open: boolean) => void;
    setPhoneNumber: (value: string) => void;
    handleBusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSeatClick: (id: string) => void;
    handleCheckout: () => void;
    confirmCheckout: () => Promise<void>;
    handleReset: () => Promise<void>;
    handleNextPage: () => void;
    handlePrevPage: () => void;
    paymentSuccess: boolean;
    paymentError: string | null;
    selectedCapacity: MatatuCapacity | '' | 'all';
    handleCapacityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    licensePlateFilter: string;
    handleLicensePlateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const useBusReservation = (): UseBusReservationReturn => {
    const [buses, setBuses] = useState<Bus[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
    const [seats, setSeats] = useState<Record<string, SeatData>>({});
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [phoneNumber, setPhoneNumber] = useState<string>('254');
    const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
    const [error, setError] = useState<ReservationError | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalBuses, setTotalBuses] = useState<number>(0);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
    const [selectedCapacity, setSelectedCapacity] = useState<MatatuCapacity | '' | 'all'>('all');
    const [licensePlateFilter, setLicensePlateFilter] = useState<string>('');
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
        initiatePayment: async () =>
            ({
                error: 'Payment hook unavailable',
            }) as StkPushResult,
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

    const validatePhone = useCallback(
        debounce((phone: string) => {
            const normalizedPhone = phone.trim().replace(/[\s,-]/g, '');
            if (!normalizedPhone || normalizedPhone.length < 12 || !normalizedPhone.startsWith('254')) {
                setIsPhoneValid(false);
                setError(null);
                return;
            }
            const validationResult = validatePhonePrefix(normalizedPhone);
            console.log('Phone validation:', { phone, normalizedPhone, validationResult, isPhoneValid });
            setIsPhoneValid(validationResult.isValid);
            if (!validationResult.isValid) {
                setError({
                    message: validationResult.errorMessage || 'Invalid phone number format',
                    type: 'validation',
                });
                toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)');
            } else {
                setError(null);
            }
        }, 300),
        [],
    );

    useEffect(() => {
        validatePhone(phoneNumber);
        return () => validatePhone.cancel();
    }, [phoneNumber, validatePhone]);

    const handlePhoneChange = (value: string) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setPhoneNumber(sanitizedValue);
    };

    const fetchBuses = useCallback(
        async (page: number) => {
            try {
                const { buses: busData, total } = await getBuses(page, pageSize, {
                    capacity: selectedCapacity !== 'all' ? Number(selectedCapacity) : undefined,
                    licensePlate: licensePlateFilter.trim() || undefined,
                });
                if (!busData || !Array.isArray(busData)) {
                    throw new Error('Invalid bus data received');
                }
                if (busData.length === 0 && total === 0) {
                    setError({ message: 'No buses found for the selected filters', type: 'validation' });
                    toast.error('No buses available');
                } else {
                    setBuses(busData);
                    setTotalBuses(total || 0);
                    if (busData.length > 0 && selectedBusId === null) {
                        setSelectedBusId(busData[0].id);
                    } else if (busData.length > 0 && !busData.some((bus) => bus.id === selectedBusId)) {
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
        [selectedBusId, selectedCapacity, licensePlateFilter],
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

        const maxSeats = 5;
        if (selectedSeats.length >= maxSeats && seat.status === 'available') {
            toast.info(`You can only select up to ${maxSeats} seats.`);
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
        console.log('Checkout button clicked:', {
            selectedSeats,
            isPhoneValid,
            total,
            isLoading: paymentLoading || stkQueryLoading,
        });
        if (selectedSeats.length === 0 || !selectedBusId) {
            setError({ message: 'Please select a bus and at least one seat', type: 'validation' });
            toast.error('Please select a bus and at least one seat');
            return;
        }

        if (!isPhoneValid) {
            setError({ message: 'Invalid phone number format', type: 'validation' });
            toast.error('Please enter a valid phone number (e.g., 2547XX...)');
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

        try {
            if (!validationResult.isValid) {
                setError({
                    message: validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)',
                    type: 'validation',
                });
                toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)');
                setIsCheckoutModalOpen(false);
                return;
            }

            if (paymentLoading || stkQueryLoading) {
                setError({
                    message: 'A payment is already in progress. Please wait.',
                    type: 'payment',
                });
                toast.error('A payment is already in progress. Please wait.');
                console.error('Payment already in progress', { paymentLoading, stkQueryLoading });
                return;
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

            if (
                !paymentResult ||
                'error' in paymentResult ||
                !paymentResult.data ||
                !paymentResult.data.CheckoutRequestID
            ) {
                setError({
                    message: 'Unable to process payment. Please try again.',
                    type: 'payment',
                });
                toast.error('Unable to process payment. Please try again.');
                console.error('Payment initiation failed', {
                    paymentResult,
                    error:
                        paymentResult && 'error' in paymentResult
                            ? paymentResult.error
                            : 'No response or invalid response',
                });
                return;
            }

            toast.info('Payment initiated. Please check your phone to complete the STK push.');

            const paymentTimeout = setTimeout(() => {
                if (!paymentData && !paymentError) {
                    setError({
                        message: 'Payment timed out. Please check your phone and try again.',
                        type: 'payment',
                    });
                    toast.error('Payment timed out. Please check your phone and try again.');
                    console.error('Payment processing timed out', { paymentData, paymentError });
                    resetPayment();
                }
            }, 30000);

            while (!paymentData && !paymentError && (paymentLoading || stkQueryLoading)) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            clearTimeout(paymentTimeout);

            if (paymentError || !paymentData) {
                setError({
                    message: 'Payment confirmation failed. Please try again.',
                    type: 'payment',
                });
                toast.error('Payment confirmation failed. Please try again.');
                console.error('Payment confirmation failed', { paymentError, paymentData });
                return;
            }

            if (paymentData.ResultCode !== '0') {
                setError({
                    message: 'Payment was not completed. Please try again.',
                    type: 'payment',
                });
                toast.error('Payment was not completed. Please try again.');
                console.error('Payment failed', {
                    resultCode: paymentData.ResultCode,
                    resultDesc: paymentData.ResultDesc,
                });
                return;
            }

            const reservationResult = await reserveSeats(selectedSeats);
            if (!reservationResult.success) {
                setError({
                    message: 'Unable to reserve seats. Please try again.',
                    type: 'reservation',
                });
                toast.error('Unable to reserve seats. Please try again.');
                console.error('Reservation failed', { error: reservationResult.error });
                return;
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
            const errorMessage = 'An unexpected error occurred. Please try again later.';
            setError({
                message: errorMessage,
                type: 'unknown',
                details: err instanceof Error ? err.stack : String(err),
            });
            toast.error(errorMessage);
            console.error('Unexpected error in confirmCheckout:', err);
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
                toast.error('Unable to reset reservations. Please try again.');
                throw new Error(resetResult.error || 'Reset failed');
            }
            await loadSeats();
            setSelectedSeats([]);
            setPhoneNumber('254');
            setSelectedCapacity('all');
            setLicensePlateFilter('');
            resetPayment();
            toast.success(`Cleared ${resetResult.deletedCount} reservations successfully`);
            setError(null);
        } catch (err) {
            const errorMessage = 'Unable to reset reservations. Please try again.';
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

    const handleCapacityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as MatatuCapacity | '' | 'all';
        setSelectedCapacity(value);
        setCurrentPage(1);
    };

    const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLicensePlateFilter(e.target.value);
        setCurrentPage(1);
    };

    return {
        buses,
        selectedBusId,
        seats,
        selectedSeats,
        total,
        phoneNumber,
        isPhoneValid,
        isLoading: paymentLoading || stkQueryLoading,
        error,
        setError,
        currentPage,
        totalPages: Math.ceil(totalBuses / pageSize) || 1,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        setPhoneNumber: handlePhoneChange,
        handleBusChange,
        handleSeatClick,
        handleCheckout,
        confirmCheckout,
        handleReset,
        handleNextPage,
        handlePrevPage,
        paymentSuccess,
        paymentError,
        selectedCapacity,
        handleCapacityChange,
        licensePlateFilter,
        handleLicensePlateChange,
    };
};

export default useBusReservation;
