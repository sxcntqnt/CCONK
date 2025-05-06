// src/utils/constants/mpesa-urls.ts
// Export URLs as constants
export const MPESA_SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
export const MPESA_LIVE_URL = 'https://api.safaricom.co.ke';
// Determine which URL to use based on environment
export const MPESA_BASE_URL = process.env.NODE_ENV === 'production' ? MPESA_LIVE_URL : MPESA_SANDBOX_URL;
