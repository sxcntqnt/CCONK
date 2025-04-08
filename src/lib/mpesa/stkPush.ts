// lib/mpesa/stkPush.ts
'use server'; // Mark as server-only

import axios, { AxiosError } from 'axios';
import { MPESA_BASE_URL } from '@/utils/constants/mpesa-urls'; // Use dynamic base URL

// Define request body type
interface StkPushRequest {
    mpesa_number: string;
    name: string;
    amount: number;
}

// Define response types (based on M-Pesa STK Push response)
interface StkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

// Define error response type
interface ErrorResponse {
    error?: string;
    requestId?: string;
    errorCode?: string;
    errorMessage?: string;
}

export async function initiateStkPush({
    mpesa_number: phoneNumber,
    name,
    amount,
}: StkPushRequest): Promise<StkPushResponse | { error: string }> {
    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/callback';

    try {
        // Generate authorization token
        const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString(
            'base64',
        );

        const tokenResponse = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const token = tokenResponse.data.access_token;

        // Format phone number (e.g., convert to 254XXXXXXXXX)
        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        const formattedPhone = `254${cleanedNumber.slice(-9)}`;

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
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const paymentData = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount.toString(),
            PartyA: formattedPhone,
            PartyB: shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `${name}_${Date.now()}`, // Using name instead of phone for reference
            TransactionDesc: `Payment by ${name} for bus reservation`,
        };

        const response = await axios.post<StkPushResponse>(
            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
            paymentData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error('Error processing STK Push:', axiosError.message);
        const errorMessage = axiosError.response?.data?.errorMessage || 'Failed to process payment request';
        return { error: errorMessage };
    }
}
