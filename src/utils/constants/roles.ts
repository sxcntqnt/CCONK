// src/constants/roles.ts
export const ROLES = {
    PASSENGER: 'PASSENGER' as const,
    DRIVER: 'DRIVER' as const,
    OWNER: 'OWNER' as const,
    ORGANIZATION: 'ORGANIZATION' as const,
};

// Array for ordered switch states: 0 = PASSENGER, 1 = DRIVER, 2 = OWNER
export const ROLE_ORDER = [ROLES.PASSENGER, ROLES.DRIVER, ROLES.OWNER, ROLES.ORGANIZATION] as const;

// Type for TypeScript inference
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TRIP_STATUS = {
    SCHEDULED: 'SCHEDULED' as const,
    IN_PROGRESS: 'IN_PROGRESS' as const,
    COMPLETED: 'COMPLETED' as const,
    CANCELLED: 'CANCELLED' as const,
};

// Array for ordered trip status
export const TRIP_STATUS_ORDER = [
    TRIP_STATUS.SCHEDULED,
    TRIP_STATUS.IN_PROGRESS,
    TRIP_STATUS.COMPLETED,
    TRIP_STATUS.CANCELLED,
] as const;

// Type for TypeScript inference
export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

export const DRIVER_STATUS = {
    ACTIVE: 'ACTIVE' as const,
    INACTIVE: 'INACTIVE' as const,
    SUSPENDED: 'SUSPENDED' as const,
};

export const DRIVER_STATUS_ORDER = [DRIVER_STATUS.ACTIVE, DRIVER_STATUS.INACTIVE, DRIVER_STATUS.SUSPENDED] as const;

export type DriverStatus = (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS];
