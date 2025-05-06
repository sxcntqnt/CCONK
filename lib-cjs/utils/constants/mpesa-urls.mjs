"use strict";
// src/utils/constants/mpesa-urls.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MPESA_BASE_URL = exports.MPESA_LIVE_URL = exports.MPESA_SANDBOX_URL = void 0;
// Export URLs as constants
exports.MPESA_SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
exports.MPESA_LIVE_URL = 'https://api.safaricom.co.ke';
// Determine which URL to use based on environment
exports.MPESA_BASE_URL = process.env.NODE_ENV === 'production' ? exports.MPESA_LIVE_URL : exports.MPESA_SANDBOX_URL;
