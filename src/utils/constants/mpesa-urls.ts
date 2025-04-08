// src/utils/constants/mpesa-urls.ts

// Define possible M-Pesa base URLs as a union type
export type MpesaBaseUrl = 'https://sandbox.safaricom.co.ke' | 'https://api.safaricom.co.ke';

// Export URLs as constants
export const MPESA_SANDBOX_URL: MpesaBaseUrl = 'https://sandbox.safaricom.co.ke';
export const MPESA_LIVE_URL: MpesaBaseUrl = 'https://api.safaricom.co.ke';

// Determine which URL to use based on environment
export const MPESA_BASE_URL: MpesaBaseUrl = process.env.NODE_ENV === 'production' ? MPESA_LIVE_URL : MPESA_SANDBOX_URL;
