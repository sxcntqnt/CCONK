// src/utils/constants/phone-constants.ts

/**
 * Array of valid Kenyan mobile number prefixes with 254 country code
 * Format: 254 followed by 3-digit mobile prefix
 */
export const VALID_PHONE_PREFIXES: string[] = [
    // 10x range (100-109)
    ...Array.from({ length: 10 }, (_, i) => `25410${i}`),
    // 11x range (110-119)
    ...Array.from({ length: 10 }, (_, i) => `25411${i}`),
    // 70x-79x range
    ...Array.from({ length: 100 }, (_, i) => `2547${Math.floor(i / 10)}${i % 10}`),
];

/**
 * Regular expression for validating Kenyan phone numbers
 * Matches: 254 followed by valid prefix and exactly 9 digits
 */
export const PHONE_PREFIX_REGEX: RegExp = /^254(10[0-9]|11[0-9]|7[0-9]{2})\d{6}$/;

export const PHONE_VALIDATION_CONFIG = {
    exactLength: 12, // 254 + 3-digit prefix + 6 digits
    countryCode: '254',
};

export interface PhoneValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

export function validatePhonePrefix(phoneNumber: string): PhoneValidationResult {
    // Check if phone number is provided
    if (!phoneNumber) {
        return {
            isValid: false,
            errorMessage: 'Phone number is required',
        };
    }

    // Remove any spaces, commas, or special characters
    const cleanedNumber = phoneNumber.trim().replace(/[\s,-]/g, '');

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log('validatePhonePrefix:', {
            input: phoneNumber,
            cleanedNumber,
            length: cleanedNumber.length,
            expectedLength: PHONE_VALIDATION_CONFIG.exactLength,
        });
    }

    // Check exact length
    if (cleanedNumber.length !== PHONE_VALIDATION_CONFIG.exactLength) {
        const errorMessage = `Phone number must be exactly ${PHONE_VALIDATION_CONFIG.exactLength - 3} digits after ${PHONE_VALIDATION_CONFIG.countryCode}`;
        if (process.env.NODE_ENV === 'development') {
            console.log('validatePhonePrefix: Length check failed', { errorMessage });
        }
        return {
            isValid: false,
            errorMessage,
        };
    }

    // Check if it matches the valid prefix pattern and length
    if (!PHONE_PREFIX_REGEX.test(cleanedNumber)) {
        const errorMessage = 'Invalid phone number format or prefix';
        if (process.env.NODE_ENV === 'development') {
            console.log('validatePhonePrefix: Regex check failed', { cleanedNumber, errorMessage });
        }
        return {
            isValid: false,
            errorMessage,
        };
    }

    // Verify prefix
    const prefix = cleanedNumber.slice(0, 6); // Extract 254XXX
    if (!VALID_PHONE_PREFIXES.includes(prefix)) {
        const errorMessage = 'Invalid phone number prefix';
        if (process.env.NODE_ENV === 'development') {
            console.log('validatePhonePrefix: Prefix check failed', { prefix, errorMessage });
        }
        return {
            isValid: false,
            errorMessage,
        };
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('validatePhonePrefix: Validation passed', { cleanedNumber, prefix });
    }

    return {
        isValid: true,
    };
}
