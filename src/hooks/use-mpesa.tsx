// src/hooks/use-mpesa.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { initiateStkPush } from '@/lib/mpesa/stkPush';
import { stkPushQuery } from '@/lib/mpesa/stkPushQuery';
import { PHONE_PREFIX_REGEX, validatePhonePrefix, PHONE_VALIDATION_CONFIG } from '@/utils/constants/phone-constants';

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

interface StkPushState {
    isLoading: boolean;
    stkQueryLoading: boolean;
    paymentSuccess: boolean;
    paymentError: string | null;
    paymentData: StkPushQueryData | null;
}

interface StkPushParams {
    phoneNumber: string;
    totalAmount: number;
    name?: string;
}

const POLLING_INTERVAL = 2000;
const MAX_ATTEMPTS = 15;

export const useStkPush = () => {
    const [state, setState] = useState<StkPushState>({
        isLoading: false,
        stkQueryLoading: false,
        paymentSuccess: false,
        paymentError: null,
        paymentData: null,
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            reset(); // Clear state on unmount
        };
    }, []);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const queryStkPushStatus = useCallback(
        async (checkoutRequestID: string) => {
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
                    const result = await stkPushQuery(checkoutRequestID);

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
                } catch (err) {
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
        },
        [stopPolling],
    );

    const initiatePayment = useCallback(
        async ({ phoneNumber, totalAmount, name = 'PASSENGER' }: StkPushParams) => {
            if (!isMountedRef.current) return;

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
            const prefixValidation = validatePhonePrefix(cleanedPhoneNumber);
            if (!prefixValidation.isValid) {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    paymentError: prefixValidation.errorMessage || 'Invalid phone number prefix',
                }));
                return { error: prefixValidation.errorMessage || 'Invalid phone number prefix' };
            }

            // Validate full number with PHONE_PREFIX_REGEX and remaining digits
            if (!PHONE_PREFIX_REGEX.test(cleanedPhoneNumber)) {
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
                const result = await initiateStkPush({
                    mpesa_number: cleanedPhoneNumber,
                    name,
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
            } catch (err) {
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
        },
        [queryStkPushStatus],
    );

    const reset = useCallback(() => {
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
