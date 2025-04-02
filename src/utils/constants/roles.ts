// src/constants/roles.ts
export const ROLES = {
    PASSENGER: 'PASSENGER' as const,
    DRIVER: 'DRIVER' as const,
    OWNER: 'OWNER' as const,
};

// Array for ordered switch states: 0 = PASSENGER, 1 = DRIVER, 2 = OWNER
export const ROLE_ORDER = [ROLES.PASSENGER, ROLES.DRIVER, ROLES.OWNER] as const;

// Type for TypeScript inference
export type Role = (typeof ROLES)[keyof typeof ROLES];
