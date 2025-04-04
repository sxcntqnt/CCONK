// page for mpesa stk push
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';
import { db } from '@/lib';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<StkPushResponse | ErrorResponse>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription, CustomerMessage } = req.body;

    if (!MerchantRequestID || !CheckoutRequestID || !ResponseCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        console.log('M-Pesa Callback:', req.body);

        // Update the payment record instead of transaction
        await db.payment.update({
            where: { transactionId: CheckoutRequestID }, // Using transactionId from Payment model
            data: {
                status: ResponseCode === '0' ? 'completed' : 'failed', // Map M-Pesa response to your status
                updatedAt: new Date(),
                // You might want to store these additional fields by adding them to your Payment model
                // responseCode: ResponseCode,
                // responseDescription: ResponseDescription,
                // customerMessage: CustomerMessage,
            },
        });

        return res.status(200).json({
            MerchantRequestID,
            CheckoutRequestID,
            ResponseCode,
            ResponseDescription,
            CustomerMessage,
        });
    } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        console.error('Error processing M-Pesa callback:', axiosError.message);

        const status = axiosError.response?.status || 500;
        const errorData = axiosError.response?.data || { error: 'Failed to process callback' };

        return res.status(status).json(errorData);
    }
}

export const config = {
    api: {
        bodyParser: true,
    },
};
