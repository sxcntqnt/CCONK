'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSeats, getBuses, reserveSeats, resetReservations } from '@/lib/prisma/dbClient';
import { validatePhonePrefix } from '@/utils/constants/phone-constants';
import { useStkPush } from '@/hooks/use-mpesa';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { MatatuCapacity } from '@/utils/constants/matatuSeats';

/**
 * Interfaces for type safety
 */
interface StkPushResponse {
    CheckoutRequestID: string;
}

interface StkPushQueryData {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage?: string;
    ResultCode: string;
    ResultDesc: string;
    CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
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
    setPhoneNumber: (value: string) => void;
    handleBusChange: (busId: number) => void;
    handleSeatClick: (id: string) => void;
    handleCheckout: () => void;
    confirmCheckout: (clerkId: string) => Promise<void>;
    handleReset: () => Promise<void>;
    handleNextPage: () => void;
    handlePrevPage: () => void;
    paymentSuccess: boolean;
    paymentError: string | null;
    selectedCapacity: MatatuCapacity | '' | 'all';
    handleCapacityChange: (capacity: MatatuCapacity | '' | 'all') => void;
    licensePlateFilter: string;
    handleLicensePlateChange: (value: string) => void;
    currentPage: number;
    totalPages: number;
    isCheckoutModalOpen: boolean;
    setIsCheckoutModalOpen: (open: boolean) => void;
}

/**
 * Constants
 */
const MINIMUM_PAYMENT_THRESHOLD = 20;
const PAGE_SIZE = 10;
const MAX_SEATS = 5;

/**
 * Custom hook for managing bus reservation logic
 * @returns {UseBusReservationReturn} Reservation state and handlers
 */
export default function useBusReservation(): UseBusReservationReturn {
    // State
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

    // Payment Hook
    const {
        initiatePayment = async () => ({ error: 'Payment hook unavailable' }) as StkPushResult,
        isLoading: paymentLoading = false,
        stkQueryLoading = false,
        paymentSuccess = false,
        paymentError = null,
        paymentData = null,
        reset: resetPayment = () => {},
    } = useStkPush() ?? {};

    // Computed values
    const total = useMemo(
        () => selectedSeats.reduce((sum, id) => sum + (seats[id]?.price || 0), 0),
        [selectedSeats, seats],
    );

    const totalPages = useMemo(() => Math.ceil(totalBuses / PAGE_SIZE) || 1, [totalBuses]);

    /**
     * Validates phone number with debouncing
     */
    const validatePhone = useCallback(
        debounce((phone: string) => {
            const normalizedPhone = phone.trim().replace(/[\s,-]/g, '');
            if (!normalizedPhone || normalizedPhone.length < 12 || !normalizedPhone.startsWith('254')) {
                setIsPhoneValid(false);
                setError(null);
                return;
            }
            const validationResult = validatePhonePrefix(normalizedPhone);
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

    /**
     * Handles phone number input changes
     */
    const handlePhoneChange = useCallback((value: string) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setPhoneNumber(sanitizedValue);
    }, []);

    /**
     * Fetches buses based on filters and pagination
     */
    const fetchBuses = useCallback(async () => {
        try {
            const capacityFilter =
                selectedCapacity !== 'all' && selectedCapacity ? Number(selectedCapacity) : undefined;
            const { buses: busData, total } = await getBuses(currentPage, PAGE_SIZE, {
                capacity: capacityFilter,
                licensePlate: licensePlateFilter.trim() || undefined,
            });

            if (!busData || !Array.isArray(busData)) {
                throw new Error('Invalid bus data received');
            }

            setBuses(busData);
            setTotalBuses(total || 0);

            if (busData.length > 0) {
                if (selectedBusId === null || !busData.some((bus) => bus.id === selectedBusId)) {
                    setSelectedBusId(busData[0].id);
                }
            } else if (total === 0) {
                setError({ message: 'No buses found for the selected filters', type: 'validation' });
                toast.error('No buses available');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load buses';
            setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
            toast.error(message);
        }
    }, [currentPage, selectedBusId, selectedCapacity, licensePlateFilter]);

    /**
     * Loads seats for the selected bus
     */
    const loadSeats = useCallback(async () => {
        if (selectedBusId === null) {
            setError({ message: 'No bus selected', type: 'validation' });
            toast.error('No bus selected');
            return;
        }
        try {
            const seatData = await getSeats(selectedBusId);
            if (!seatData || Object.keys(seatData).length === 0) {
                throw new Error('No seats available for this bus');
            }
            setSeats(seatData);
            setSelectedSeats([]);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch seats';
            setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
            toast.error(message);
        }
    }, [selectedBusId]);

    /**
     * Handles bus selection
     */
    const handleBusChange = useCallback((busId: number) => {
        if (isNaN(busId)) {
            setError({ message: 'Invalid bus selection', type: 'validation' });
            toast.error('Invalid bus selection');
            return;
        }
        setSelectedBusId(busId);
    }, []);

    /**
     * Handles seat selection/deselection
     */
    const handleSeatClick = useCallback(
        (id: string) => {
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
            if (selectedSeats.length >= MAX_SEATS && seat.status === 'available') {
                toast.info(`You can only select up to ${MAX_SEATS} seats.`);
                return;
            }
            const newStatus = seat.status === 'available' ? 'selected' : 'available';
            setSeats((prev) => ({ ...prev, [id]: { ...seat, status: newStatus } }));
            setSelectedSeats((prev) =>
                newStatus === 'selected' ? [...prev, id] : prev.filter((seatId) => seatId !== id),
            );
        },
        [seats, selectedSeats],
    );

    /**
     * Initiates checkout process
     */
    const handleCheckout = useCallback(() => {
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
        if (total < MINIMUM_PAYMENT_THRESHOLD) {
            setError({
                message: `Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`,
                type: 'validation',
            });
            toast.error(`Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`);
            return;
        }
        setIsCheckoutModalOpen(true);
    }, [selectedSeats, selectedBusId, isPhoneValid, total]);

    /**
     * Confirms checkout with payment and reservation
     */
    const confirmCheckout = useCallback(
        async (clerkId: string) => {
            try {
                const normalizedPhone = phoneNumber.trim().replace(/[\s,-]/g, '');
                const validationResult = validatePhonePrefix(normalizedPhone);

                if (!validationResult.isValid) {
                    setError({
                        message: validationResult.errorMessage || 'Invalid phone number format',
                        type: 'validation',
                    });
                    toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)');
                    return;
                }

                if (total < MINIMUM_PAYMENT_THRESHOLD) {
                    setError({
                        message: `Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`,
                        type: 'validation',
                    });
                    toast.error(`Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`);
                    return;
                }

                if (paymentLoading || stkQueryLoading) {
                    setError({ message: 'Payment in progress. Please wait.', type: 'payment' });
                    toast.error('Payment in progress. Please wait.');
                    return;
                }

                const paymentResult = await initiatePayment({
                    phoneNumber: normalizedPhone,
                    totalAmount: total,
                    clerkId,
                });

                if (!paymentResult?.data?.CheckoutRequestID) {
                    setError({ message: 'Unable to process payment', type: 'payment' });
                    toast.error('Unable to process payment');
                    return;
                }

                toast.info('Payment initiated. Please check your phone.');

                const paymentTimeout = setTimeout(() => {
                    if (!paymentData && !paymentError) {
                        setError({ message: 'Payment timed out', type: 'payment' });
                        toast.error('Payment timed out');
                        resetPayment();
                    }
                }, 30000);

                while (!paymentData && !paymentError && (paymentLoading || stkQueryLoading)) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                clearTimeout(paymentTimeout);

                if (paymentError || !paymentData || paymentData.ResultCode !== '0') {
                    setError({ message: 'Payment failed', type: 'payment' });
                    toast.error('Payment failed');
                    return;
                }

                const reservationResult = await reserveSeats(selectedSeats);
                if (!reservationResult.success) {
                    setError({ message: 'Unable to reserve seats', type: 'reservation' });
                    toast.error('Unable to reserve seats');
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
                toast.success(`Reserved ${reservationResult.reservedCount} seats!`);
                resetPayment();
            } catch (err) {
                const message = 'Unexpected error occurred';
                setError({ message, type: 'unknown', details: err instanceof Error ? err.stack : String(err) });
                toast.error(message);
            } finally {
                setIsCheckoutModalOpen(false);
            }
        },
        [
            phoneNumber,
            total,
            selectedSeats,
            initiatePayment,
            paymentData,
            paymentError,
            paymentLoading,
            stkQueryLoading,
            resetPayment,
        ],
    );

    /**
     * Resets reservations for the selected bus
     */
    const handleReset = useCallback(async () => {
        if (!selectedBusId) {
            setError({ message: 'No bus selected', type: 'validation' });
            toast.error('No bus selected');
            return;
        }
        if (!confirm('Reset all reservations for this bus?')) return;
        try {
            const resetResult = await resetReservations(selectedBusId);
            if (!resetResult.success) {
                throw new Error('Reset failed');
            }
            await loadSeats();
            setSelectedSeats([]);
            setPhoneNumber('254');
            setSelectedCapacity('all');
            setLicensePlateFilter('');
            resetPayment();
            toast.success(`Cleared ${resetResult.deletedCount} reservations`);
            setError(null);
        } catch (err) {
            const message = 'Unable to reset reservations';
            setError({ message, type: 'reservation', details: err instanceof Error ? err.stack : undefined });
            toast.error(message);
        }
    }, [selectedBusId, loadSeats, resetPayment]);

    /**
     * Navigates to the next page
     */
    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        } else {
            toast.info('No more pages');
        }
    }, [currentPage, totalPages]);

    /**
     * Navigates to the previous page
     */
    const handlePrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        } else {
            toast.info('First page');
        }
    }, [currentPage]);

    /**
     * Handles capacity filter changes
     */
    const handleCapacityChange = useCallback((capacity: MatatuCapacity | '' | 'all') => {
        setSelectedCapacity(capacity);
        setCurrentPage(1);
    }, []);

    /**
     * Handles license plate filter changes
     */
    const handleLicensePlateChange = useCallback((value: string) => {
        setLicensePlateFilter(value);
        setCurrentPage(1);
    }, []);

    // Effects
    useEffect(() => {
        validatePhone(phoneNumber);
        return () => validatePhone.cancel();
    }, [phoneNumber, validatePhone]);

    useEffect(() => {
        fetchBuses();
    }, [fetchBuses]);

    useEffect(() => {
        loadSeats();
    }, [loadSeats]);

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
        currentPage,
        totalPages,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
    };
}
