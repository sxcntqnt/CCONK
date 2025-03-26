// lib/mpesa/stkPush.ts
import axios, { AxiosError } from 'axios';
import { getMpesaToken } from './token';

// Define request body type
interface StkPushRequest {
    amount: number;
    phone: string;
}

// Define response types
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

export async function initiateStkPush({ amount, phone }: StkPushRequest): Promise<StkPushResponse> {
    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/callback';

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const paymentData = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount.toString(),
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: `Reservation_${Date.now()}`,
        TransactionDesc: 'Bus seat reservation',
    };

    try {
        const token = await getMpesaToken();
        const response = await axios.post<StkPushResponse>(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
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
        throw new Error(axiosError.response?.data?.errorMessage || 'Failed to process payment request');
    }
}

// Optional API Handler (if you still want it as an API route)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, phone } = req.body as StkPushRequest;

    if (!amount || !phone) {
        return res.status(400).json({ error: 'Amount and phone number are required' });
    }

    try {
        const result = await initiateStkPush({ amount, phone });
        res.status(200).json(result);
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        res.status(axiosError.response?.status || 500).json({
            error: axiosError.response?.data?.errorMessage || 'Payment failed',
        });
    }
}
