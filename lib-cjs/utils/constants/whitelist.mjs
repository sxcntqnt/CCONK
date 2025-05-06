"use strict";
// src/utils/constants/whitelist.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.whitelist = void 0;
exports.isWhitelistedIP = isWhitelistedIP;
exports.isValidIPv4 = isValidIPv4;
exports.whitelist = [
    '196.201.214.200',
    '196.201.214.206',
    '196.201.213.114',
    '196.201.214.207',
    '196.201.214.208',
    '196.201.213.44',
    '196.201.212.127',
    '196.201.212.138',
    '196.201.212.129',
    '196.201.212.136',
    '196.201.212.74',
    '196.201.212.69',
];
/**
 * Type guard to check if a string is in the whitelist.
 */
function isWhitelistedIP(ip) {
    try {
        return exports.whitelist.includes(ip);
    }
    catch {
        return false;
    }
}
/**
 * Validates if a string is a properly formatted IPv4 address.
 * - Ensures 4 octets
 * - Each octet must be between 0 and 255
 */
function isValidIPv4(ip) {
    try {
        const regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!regex.test(ip))
            return false;
        const parts = ip.split('.').map(Number);
        return parts.length === 4 && parts.every((part) => part >= 0 && part <= 255);
    }
    catch {
        return false;
    }
}
