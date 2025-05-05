"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = useBusReservation;
const react_1 = require("react");
const dbClient_1 = require("@/lib/prisma/dbClient");
const phone_constants_1 = require("@/utils/constants/phone-constants");
const use_mpesa_1 = require("@/hooks/use-mpesa");
const sonner_1 = require("sonner");
const lodash_1 = require("lodash");
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
function useBusReservation() {
    // State
    const [buses, setBuses] = (0, react_1.useState)([]);
    const [selectedBusId, setSelectedBusId] = (0, react_1.useState)(null);
    const [seats, setSeats] = (0, react_1.useState)({});
    const [selectedSeats, setSelectedSeats] = (0, react_1.useState)([]);
    const [phoneNumber, setPhoneNumber] = (0, react_1.useState)('254');
    const [isPhoneValid, setIsPhoneValid] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [totalBuses, setTotalBuses] = (0, react_1.useState)(0);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = (0, react_1.useState)(false);
    const [selectedCapacity, setSelectedCapacity] = (0, react_1.useState)('all');
    const [licensePlateFilter, setLicensePlateFilter] = (0, react_1.useState)('');
    // Payment Hook
    const { initiatePayment = async () => ({ error: 'Payment hook unavailable' }), isLoading: paymentLoading = false, stkQueryLoading = false, paymentSuccess = false, paymentError = null, paymentData = null, reset: resetPayment = () => { }, } = (0, use_mpesa_1.useStkPush)() ?? {};
    // Computed values
    const total = (0, react_1.useMemo)(() => selectedSeats.reduce((sum, id) => sum + (seats[id]?.price || 0), 0), [selectedSeats, seats]);
    const totalPages = (0, react_1.useMemo)(() => Math.ceil(totalBuses / PAGE_SIZE) || 1, [totalBuses]);
    /**
     * Validates phone number with debouncing
     */
    const validatePhone = (0, react_1.useCallback)((0, lodash_1.debounce)((phone) => {
        const normalizedPhone = phone.trim().replace(/[\s,-]/g, '');
        if (!normalizedPhone || normalizedPhone.length < 12 || !normalizedPhone.startsWith('254')) {
            setIsPhoneValid(false);
            setError(null);
            return;
        }
        const validationResult = (0, phone_constants_1.validatePhonePrefix)(normalizedPhone);
        setIsPhoneValid(validationResult.isValid);
        if (!validationResult.isValid) {
            setError({
                message: validationResult.errorMessage || 'Invalid phone number format',
                type: 'validation',
            });
            sonner_1.toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)');
        }
        else {
            setError(null);
        }
    }, 300), []);
    /**
     * Handles phone number input changes
     */
    const handlePhoneChange = (0, react_1.useCallback)((value) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setPhoneNumber(sanitizedValue);
    }, []);
    /**
     * Fetches buses based on filters and pagination
     */
    const fetchBuses = (0, react_1.useCallback)(async () => {
        try {
            const capacityFilter = selectedCapacity !== 'all' && selectedCapacity ? Number(selectedCapacity) : undefined;
            const { buses: busData, total } = await (0, dbClient_1.getBuses)(currentPage, PAGE_SIZE, {
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
            }
            else if (total === 0) {
                setError({ message: 'No buses found for the selected filters', type: 'validation' });
                sonner_1.toast.error('No buses available');
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load buses';
            setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
            sonner_1.toast.error(message);
        }
    }, [currentPage, selectedBusId, selectedCapacity, licensePlateFilter]);
    /**
     * Loads seats for the selected bus
     */
    const loadSeats = (0, react_1.useCallback)(async () => {
        if (selectedBusId === null) {
            setError({ message: 'No bus selected', type: 'validation' });
            sonner_1.toast.error('No bus selected');
            return;
        }
        try {
            const seatData = await (0, dbClient_1.getSeats)(selectedBusId);
            if (!seatData || Object.keys(seatData).length === 0) {
                throw new Error('No seats available for this bus');
            }
            setSeats(seatData);
            setSelectedSeats([]);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch seats';
            setError({ message, type: 'network', details: err instanceof Error ? err.stack : undefined });
            sonner_1.toast.error(message);
        }
    }, [selectedBusId]);
    /**
     * Handles bus selection
     */
    const handleBusChange = (0, react_1.useCallback)((busId) => {
        if (isNaN(busId)) {
            setError({ message: 'Invalid bus selection', type: 'validation' });
            sonner_1.toast.error('Invalid bus selection');
            return;
        }
        setSelectedBusId(busId);
    }, []);
    /**
     * Handles seat selection/deselection
     */
    const handleSeatClick = (0, react_1.useCallback)((id) => {
        const seat = seats[id];
        if (!seat) {
            setError({ message: `Seat ${id} not found`, type: 'validation' });
            sonner_1.toast.error(`Seat ${id} not found`);
            return;
        }
        if (seat.status === 'reserved') {
            sonner_1.toast.info('This seat is already reserved');
            return;
        }
        if (selectedSeats.length >= MAX_SEATS && seat.status === 'available') {
            sonner_1.toast.info(`You can only select up to ${MAX_SEATS} seats.`);
            return;
        }
        const newStatus = seat.status === 'available' ? 'selected' : 'available';
        setSeats((prev) => ({ ...prev, [id]: { ...seat, status: newStatus } }));
        setSelectedSeats((prev) => newStatus === 'selected' ? [...prev, id] : prev.filter((seatId) => seatId !== id));
    }, [seats, selectedSeats]);
    /**
     * Initiates checkout process
     */
    const handleCheckout = (0, react_1.useCallback)(() => {
        if (selectedSeats.length === 0 || !selectedBusId) {
            setError({ message: 'Please select a bus and at least one seat', type: 'validation' });
            sonner_1.toast.error('Please select a bus and at least one seat');
            return;
        }
        if (!isPhoneValid) {
            setError({ message: 'Invalid phone number format', type: 'validation' });
            sonner_1.toast.error('Please enter a valid phone number (e.g., 2547XX...)');
            return;
        }
        if (total < MINIMUM_PAYMENT_THRESHOLD) {
            setError({
                message: `Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`,
                type: 'validation',
            });
            sonner_1.toast.error(`Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`);
            return;
        }
        setIsCheckoutModalOpen(true);
    }, [selectedSeats, selectedBusId, isPhoneValid, total]);
    /**
     * Confirms checkout with payment and reservation
     */
    const confirmCheckout = (0, react_1.useCallback)(async (clerkId) => {
        try {
            const normalizedPhone = phoneNumber.trim().replace(/[\s,-]/g, '');
            const validationResult = (0, phone_constants_1.validatePhonePrefix)(normalizedPhone);
            if (!validationResult.isValid) {
                setError({
                    message: validationResult.errorMessage || 'Invalid phone number format',
                    type: 'validation',
                });
                sonner_1.toast.error(validationResult.errorMessage || 'Please enter a valid phone number (e.g., 2547XX...)');
                return;
            }
            if (total < MINIMUM_PAYMENT_THRESHOLD) {
                setError({
                    message: `Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`,
                    type: 'validation',
                });
                sonner_1.toast.error(`Total amount must be at least ${MINIMUM_PAYMENT_THRESHOLD}`);
                return;
            }
            if (paymentLoading || stkQueryLoading) {
                setError({ message: 'Payment in progress. Please wait.', type: 'payment' });
                sonner_1.toast.error('Payment in progress. Please wait.');
                return;
            }
            const paymentResult = await initiatePayment({
                phoneNumber: normalizedPhone,
                totalAmount: total,
                clerkId,
            });
            if (!paymentResult?.data?.CheckoutRequestID) {
                setError({ message: 'Unable to process payment', type: 'payment' });
                sonner_1.toast.error('Unable to process payment');
                return;
            }
            sonner_1.toast.info('Payment initiated. Please check your phone.');
            const paymentTimeout = setTimeout(() => {
                if (!paymentData && !paymentError) {
                    setError({ message: 'Payment timed out', type: 'payment' });
                    sonner_1.toast.error('Payment timed out');
                    resetPayment();
                }
            }, 30000);
            while (!paymentData && !paymentError && (paymentLoading || stkQueryLoading)) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            clearTimeout(paymentTimeout);
            if (paymentError || !paymentData || paymentData.ResultCode !== '0') {
                setError({ message: 'Payment failed', type: 'payment' });
                sonner_1.toast.error('Payment failed');
                return;
            }
            const reservationResult = await (0, dbClient_1.reserveSeats)(selectedSeats);
            if (!reservationResult.success) {
                setError({ message: 'Unable to reserve seats', type: 'reservation' });
                sonner_1.toast.error('Unable to reserve seats');
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
            sonner_1.toast.success(`Reserved ${reservationResult.reservedCount} seats!`);
            resetPayment();
        }
        catch (err) {
            const message = 'Unexpected error occurred';
            setError({ message, type: 'unknown', details: err instanceof Error ? err.stack : String(err) });
            sonner_1.toast.error(message);
        }
        finally {
            setIsCheckoutModalOpen(false);
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
    /**
     * Resets reservations for the selected bus
     */
    const handleReset = (0, react_1.useCallback)(async () => {
        if (!selectedBusId) {
            setError({ message: 'No bus selected', type: 'validation' });
            sonner_1.toast.error('No bus selected');
            return;
        }
        if (!confirm('Reset all reservations for this bus?'))
            return;
        try {
            const resetResult = await (0, dbClient_1.resetReservations)(selectedBusId);
            if (!resetResult.success) {
                throw new Error('Reset failed');
            }
            await loadSeats();
            setSelectedSeats([]);
            setPhoneNumber('254');
            setSelectedCapacity('all');
            setLicensePlateFilter('');
            resetPayment();
            sonner_1.toast.success(`Cleared ${resetResult.deletedCount} reservations`);
            setError(null);
        }
        catch (err) {
            const message = 'Unable to reset reservations';
            setError({ message, type: 'reservation', details: err instanceof Error ? err.stack : undefined });
            sonner_1.toast.error(message);
        }
    }, [selectedBusId, loadSeats, resetPayment]);
    /**
     * Navigates to the next page
     */
    const handleNextPage = (0, react_1.useCallback)(() => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
        else {
            sonner_1.toast.info('No more pages');
        }
    }, [currentPage, totalPages]);
    /**
     * Navigates to the previous page
     */
    const handlePrevPage = (0, react_1.useCallback)(() => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
        else {
            sonner_1.toast.info('First page');
        }
    }, [currentPage]);
    /**
     * Handles capacity filter changes
     */
    const handleCapacityChange = (0, react_1.useCallback)((capacity) => {
        setSelectedCapacity(capacity);
        setCurrentPage(1);
    }, []);
    /**
     * Handles license plate filter changes
     */
    const handleLicensePlateChange = (0, react_1.useCallback)((value) => {
        setLicensePlateFilter(value);
        setCurrentPage(1);
    }, []);
    // Effects
    (0, react_1.useEffect)(() => {
        validatePhone(phoneNumber);
        return () => validatePhone.cancel();
    }, [phoneNumber, validatePhone]);
    (0, react_1.useEffect)(() => {
        fetchBuses();
    }, [fetchBuses]);
    (0, react_1.useEffect)(() => {
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
