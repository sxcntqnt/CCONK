// lib/mpesa/token.ts
import axios, { AxiosError } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

// Define response types
interface TokenResponse {
    token: string;
}

interface ErrorResponse {
    error: string;
}

// Environment variable validation
const getAuthCredentials = (): { apiKey: string; apiSecret: string } => {
    const apiKey = process.env.MPESA_API_KEY;
    const apiSecret = process.env.MPESA_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('M-Pesa API credentials are missing in environment variables');
    }

    return { apiKey, apiSecret };
};

// Exported function for direct use
export async function getMpesaToken(): Promise<string> {
    try {
        const { apiKey, apiSecret } = getAuthCredentials();
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

        const response = await axios.get<{ access_token: string }>(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            },
        );

        return response.data.access_token;
    } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching M-Pesa token:', axiosError.message);
        throw new Error(axiosError.response?.data?.error || 'Failed to generate token');
    }
}

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse<TokenResponse | ErrorResponse>) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = await getMpesaToken();
        res.status(200).json({ token });
    } catch (error) {
        const axiosError = error as AxiosError;
        res.status(axiosError.response?.status || 500).json({
            error: axiosError.response?.data?.error || 'Failed to generate token',
        });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
