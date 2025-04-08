// lib/mpesa/stkPushQuery.ts
'use server'; // Mark as server-only

import axios, { AxiosError } from 'axios';
import { MPESA_BASE_URL } from '@/utils/constants/mpesa-urls'; // Import dynamic base URL

// Define response type for STK Push Query (based on M-Pesa API docs)
interface StkPushQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    ResultCode: string;
    ResultDesc: string;
    CheckoutRequestID: string;
    MerchantRequestID: string;
}

// Define error response type
interface ErrorResponse {
    errorCode?: string;
    errorMessage?: string;
    requestId?: string;
}

export const stkPushQuery = async (reqId: string): Promise<{ data: StkPushQueryResponse } | { error: string }> => {
    try {
        // Generate token
        const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString(
            'base64',
        );

        const tokenResponse = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`, // Capitalized Authorization as per standard
            },
        });

        const token = tokenResponse.data.access_token;

        // Generate timestamp
        const date = new Date();
        const timestamp =
            date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);

        // Generate password
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString(
            'base64',
        );

        const response = await axios.post<StkPushQueryResponse>(
            `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: reqId,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        return { data: response.data };
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error('Error querying STK Push:', axiosError.message);
        const errorMessage = axiosError.response?.data?.errorMessage || 'Failed to query payment status';
        return { error: errorMessage };
    }
};
