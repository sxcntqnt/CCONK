// lib/mpesa/stkPush.ts
'use server';

import axios, { AxiosError } from 'axios';
import { MPESA_BASE_URL } from '@/utils/constants/mpesa-urls';

interface StkPushRequest {
    mpesa_number: string;
    name: string;
    amount: number;
}

interface StkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

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

    if (!phoneNumber || phoneNumber.length < 9) {
        return { error: 'Invalid phone number: Must be at least 9 digits' };
    }
    if (!amount || amount <= 0) {
        return { error: 'Invalid amount: Must be greater than zero' };
    }
    if (!name) {
        return { error: 'Name is required' };
    }

    try {
        const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString(
            'base64',
        );

        const tokenResponse = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });

        const token = tokenResponse.data.access_token;
        if (!token) {
            return { error: 'Failed to generate access token' };
        }

        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        const formattedPhone = `254${cleanedNumber.slice(-9)}`;

        const date = new Date();
        const timestamp =
            date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);

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
            AccountReference: `${name}_${Date.now()}`,
            TransactionDesc: `Payment by ${name} for bus reservation`,
        };

        console.log('Sending STK Push request with payload:', paymentData);

        const response = await axios.post<StkPushResponse>(
            `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
            paymentData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        const data = response.data;
        console.log('STK Push response:', data);
        if (data.ResponseCode !== '0') {
            return { error: data.ResponseDescription || 'STK Push request rejected by M-Pesa' };
        }

        return data;
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error('Error processing STK Push:', {
            message: axiosError.message,
            status: axiosError.response?.status,
            responseData: axiosError.response?.data,
            requestData: {
                phoneNumber,
                amount,
                name,
            },
        });
        const errorMessage =
            axiosError.response?.data?.errorMessage || axiosError.message || 'Failed to process payment request';
        return { error: `Payment initiation failed: ${errorMessage}` };
    }
}
