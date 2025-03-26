//page for mpesa stk push
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

// Define request body type
interface StkPushRequestBody {
    token: string;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<StkPushResponse | ErrorResponse>) {
    // Restrict to POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract data from the request body
    const { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription, CustomerMessage } = req.body;

    // Validate required fields
    if (!MerchantRequestID || !CheckoutRequestID || !ResponseCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Log the transaction details for debugging
        console.log('M-Pesa Callback:', req.body);

        // Update the transaction status in the database
        await db.transaction.update({
            where: { checkoutRequestId: CheckoutRequestID },
            data: {
                responseCode: ResponseCode,
                responseDescription: ResponseDescription,
                customerMessage: CustomerMessage,
                updatedAt: new Date(),
            },
        });

        // Respond with success
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
        bodyParser: true, // Enable body parsing for POST request
    },
};
