// src/utils/constants/whitelist.ts

export const whitelist = [
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
] as const;

export type WhitelistIP = (typeof whitelist)[number];

// Type guard to check if a string is a WhitelistIP
export function isWhitelistedIP(ip: string): ip is WhitelistIP {
    return whitelist.includes(ip as WhitelistIP);
}

// Simple IP format validation (basic regex for IPv4)
export function isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(ip);
}
