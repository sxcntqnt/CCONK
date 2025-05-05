"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStkPush = void 0;
const react_1 = require("react");
const stkPush_1 = require("@/lib/mpesa/stkPush");
const stkPushQuery_1 = require("@/lib/mpesa/stkPushQuery");
const phone_constants_1 = require("@/utils/constants/phone-constants");
const POLLING_INTERVAL = 2000;
const MAX_ATTEMPTS = 15;
const useStkPush = () => {
    const [state, setState] = (0, react_1.useState)({
        isLoading: false,
        stkQueryLoading: false,
        paymentSuccess: false,
        paymentError: null,
        paymentData: null,
    });
    const intervalRef = (0, react_1.useRef)(null);
    const isMountedRef = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            reset();
        };
    }, []);
    const stopPolling = (0, react_1.useCallback)(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);
    const queryStkPushStatus = (0, react_1.useCallback)(async (checkoutRequestID) => {
        let attempts = 0;
        stopPolling();
        intervalRef.current = setInterval(async () => {
            attempts += 1;
            if (attempts >= MAX_ATTEMPTS) {
                stopPolling();
                if (isMountedRef.current) {
                    setState((prev) => ({
                        ...prev,
                        stkQueryLoading: false,
                        isLoading: false,
                        paymentError: 'Payment timed out. Please try again.',
                    }));
                }
                return;
            }
            try {
                const result = await (0, stkPushQuery_1.stkPushQuery)(checkoutRequestID);
                if ('error' in result) {
                    if (result.error.includes('pending') || result.error.includes('not found')) {
                        return;
                    }
                    stopPolling();
                    if (isMountedRef.current) {
                        setState((prev) => ({
                            ...prev,
                            stkQueryLoading: false,
                            isLoading: false,
                            paymentError: result.error,
                        }));
                    }
                    return;
                }
                const { data } = result;
                stopPolling();
                if (isMountedRef.current) {
                    setState((prev) => ({
                        ...prev,
                        stkQueryLoading: false,
                        isLoading: false,
                        paymentSuccess: data.ResultCode === '0',
                        paymentError: data.ResultCode !== '0' ? data.ResultDesc || 'Payment failed' : null,
                        paymentData: data,
                    }));
                }
            }
            catch (err) {
                stopPolling();
                if (isMountedRef.current) {
                    setState((prev) => ({
                        ...prev,
                        stkQueryLoading: false,
                        isLoading: false,
                        paymentError: 'An unexpected error occurred while checking payment status',
                    }));
                }
                console.error('stkPushQuery error:', err);
            }
        }, POLLING_INTERVAL);
    }, [stopPolling]);
    const initiatePayment = (0, react_1.useCallback)(async ({ phoneNumber, totalAmount, clerkId }) => {
        if (!isMountedRef.current)
            return { error: 'Component unmounted' };
        if (!clerkId) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                paymentError: 'Clerk user ID is required',
            }));
            return { error: 'Clerk user ID is required' };
        }
        // Clean the phone number (remove spaces, dashes, etc.)
        const cleanedPhoneNumber = phoneNumber.replace(/[\s,-]/g, '');
        // Validate full phone number length (12 digits: +254 + 9 digits)
        if (cleanedPhoneNumber.length !== 12) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                paymentError: 'Phone number must be 12 digits (e.g., +254712345678)',
            }));
            return { error: 'Invalid phone number length' };
        }
        // Validate prefix using phone-constants.ts
        const prefixValidation = (0, phone_constants_1.validatePhonePrefix)(cleanedPhoneNumber);
        if (!prefixValidation.isValid) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                paymentError: prefixValidation.errorMessage || 'Invalid phone number prefix',
            }));
            return { error: prefixValidation.errorMessage || 'Invalid phone number prefix' };
        }
        // Validate full number with PHONE_PREFIX_REGEX
        if (!phone_constants_1.PHONE_PREFIX_REGEX.test(cleanedPhoneNumber)) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                paymentError: 'Invalid Kenyan phone number format',
            }));
            return { error: 'Invalid phone number format' };
        }
        setState((prev) => ({
            ...prev,
            isLoading: true,
            paymentError: null,
            paymentSuccess: false,
            paymentData: null,
        }));
        try {
            const result = await (0, stkPush_1.initiateStkPush)({
                mpesa_number: cleanedPhoneNumber,
                name: clerkId, // Use clerkId as the name
                amount: totalAmount,
            });
            if ('error' in result) {
                if (isMountedRef.current) {
                    setState((prev) => ({ ...prev, isLoading: false, paymentError: result.error }));
                }
                return { error: result.error };
            }
            if (isMountedRef.current) {
                setState((prev) => ({ ...prev, stkQueryLoading: true }));
            }
            queryStkPushStatus(result.CheckoutRequestID);
            return { data: result };
        }
        catch (err) {
            if (isMountedRef.current) {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    paymentError: err instanceof Error ? err.message : 'Failed to initiate payment',
                }));
            }
            console.error('initiateStkPush error:', err);
            return { error: err instanceof Error ? err.message : 'Failed to initiate payment' };
        }
    }, [queryStkPushStatus]);
    const reset = (0, react_1.useCallback)(() => {
        stopPolling();
        if (isMountedRef.current) {
            setState({
                isLoading: false,
                stkQueryLoading: false,
                paymentSuccess: false,
                paymentError: null,
                paymentData: null,
            });
        }
    }, [stopPolling]);
    return {
        initiatePayment,
        isLoading: state.isLoading,
        stkQueryLoading: state.stkQueryLoading,
        paymentSuccess: state.paymentSuccess,
        paymentError: state.paymentError,
        paymentData: state.paymentData,
        reset,
    };
};
exports.useStkPush = useStkPush;
