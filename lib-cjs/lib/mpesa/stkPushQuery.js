"use strict";
// lib/mpesa/stkPushQuery.ts
'use server'; // Mark as server-only
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stkPushQuery = void 0;
const axios_1 = __importDefault(require("axios"));
const mpesa_urls_1 = require("@/utils/constants/mpesa-urls"); // Import dynamic base URL
const stkPushQuery = async (reqId) => {
    try {
        // Generate token
        const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
        const tokenResponse = await axios_1.default.get(`${mpesa_urls_1.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`, // Capitalized Authorization as per standard
            },
        });
        const token = tokenResponse.data.access_token;
        // Generate timestamp
        const date = new Date();
        const timestamp = date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);
        // Generate password
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
        const response = await axios_1.default.post(`${mpesa_urls_1.MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: reqId,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return { data: response.data };
    }
    catch (error) {
        const axiosError = error;
        console.error('Error querying STK Push:', axiosError.message);
        const errorMessage = axiosError.response?.data?.errorMessage || 'Failed to query payment status';
        return { error: errorMessage };
    }
};
exports.stkPushQuery = stkPushQuery;
