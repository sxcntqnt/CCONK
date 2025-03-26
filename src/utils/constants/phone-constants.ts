// phone-constants.ts

/**
 * Array of valid Kenyan mobile number prefixes with +254 country code
 * Format: +254 followed by 3-digit mobile prefix
 */
export const VALID_PHONE_PREFIXES: string[] = [
    // 10x range (100-109)
    '+254100',
    '+254101',
    '+254102',
    '+254103',
    '+254104',
    '+254105',
    '+254106',
    '+254107',
    '+254108',
    '+254109',
    // 11x range (110-119)
    '+254110',
    '+254111',
    '+254112',
    '+254113',
    '+254114',
    '+254115',
    '+254116',
    '+254117',
    '+254118',
    '+254119',
    // Specific prefixes
    '+254701',
    '+254702',
    '+254703',
    '+254704',
    '+254705',
    '+254706',
    '+254707',
    '+254708',
    '+254709',
    '+254710',
    '+254711',
    '+254712',
    '+254713',
    '+254714',
    '+254715',
    '+254716',
    '+254717',
    '+254718',
    '+254719',
    '+254720',
    '+254721',
    '+254722',
    '+254723',
    '+254724',
    '+254725',
    '+254726',
    '+254727',
    '+254728',
    '+254729',
    '+254730',
    '+254731',
    '+254732',
    '+254733',
    '+254734',
    '+254735',
    '+254736',
    '+254737',
    '+254738',
    '+254739',
    '+254740',
    '+254741',
    '+254742',
    '+254743',
    '+254744',
    '+254745',
    '+254746',
    '+254747',
    '+254748',
    '+254750',
    '+254751',
    '+254752',
    '+254753',
    '+254754',
    '+254755',
    '+254756',
    '+254757',
    '+254758',
    '+254759',
    '+254760',
    '+254761',
    '+254762',
    '+254763',
    '+254764',
    '+254765',
    '+254766',
    '+254767',
    '+254768',
    '+254769',
    '+254770',
    '+254771',
    '+254772',
    '+254773',
    '+254774',
    '+254775',
    '+254776',
    '+254777',
    '+254778',
    '+254779',
    '+254780',
    '+254781',
    '+254782',
    '+254783',
    '+254784',
    '+254785',
    '+254786',
    '+254787',
    '+254788',
    '+254789',
    '+254790',
    '+254791',
    '+254792',
    '+254793',
    '+254794',
    '+254795',
    '+254796',
    '+254797',
    '+254798',
    '+254799',
];

/**
 * Regular expression for validating Kenyan phone number prefixes
 * Matches: +254 followed by valid prefix
 */
export const PHONE_PREFIX_REGEX: RegExp =
    /^\+254(10[0-9]|11[0-9]|70[1-9]|71[0-9]|72[0-9]|73[0-9]|74[0-8]|75[0-9]|76[0-9]|77[0-9]|78[0-9]|79[0-9])/;

/**
 * Phone number validation configuration
 */
export const PHONE_VALIDATION_CONFIG = {
    minLength: 7, // Including +254 and 3-digit prefix
    countryCode: '+254',
};

/**
 * Type for phone number validation result
 */
export interface PhoneValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

/**
 * Utility function to validate phone number prefixes
 * @param phoneNumber The phone number prefix to validate
 * @returns PhoneValidationResult
 */
export function validatePhonePrefix(phoneNumber: string): PhoneValidationResult {
    // Remove any spaces, commas, or special characters
    const cleanedNumber = phoneNumber.replace(/[\s,-]/g, '');

    // Check minimum length (just prefix)
    if (cleanedNumber.length < PHONE_VALIDATION_CONFIG.minLength) {
        return {
            isValid: false,
            errorMessage: `Phone number prefix must be at least ${PHONE_VALIDATION_CONFIG.minLength} digits including country code`,
        };
    }

    // Check if it matches the valid prefix pattern
    if (!PHONE_PREFIX_REGEX.test(cleanedNumber)) {
        return {
            isValid: false,
            errorMessage: 'Invalid phone number prefix',
        };
    }

    return {
        isValid: true,
    };
}
