// src/utils/index.ts
// constants
import { LIST_ITEM_VARIANTS, CHILD_VARIANTS, FADE_IN_VARIANTS, MODAL_VARIANTS } from './constants/animation';
import { APP_DOMAIN, APP_HOSTNAMES, APP_NAME } from './constants/site';
import { DEFAULT_AVATAR_URL, PAGINATION_LIMIT, COMPANIES, PROCESS } from './constants/misc';
import { PLANS, PRICING_FEATURES, WORKSPACE_LIMIT } from './constants/pricing';
import { NAV_LINKS } from './constants/nav-links';
import { aeonik, inter } from './constants/fonts';
import { ROLE_ORDER, ROLES, Role } from './constants/roles';

// Import all required enums from @prisma/client
import {
    MatatuCapacity,
    SeatCategory,
    SeatStatus,
    DriverStatus,
    TripStatus,
    ReservationStatus,
    PaymentStatus,
} from '@prisma/client';

// functions
import { cn } from './functions/cn';
import { isValidUrl } from './functions/urls';
import { generateMetadata } from './functions/metadata';
import { mapDriverAndBusToMarkerData, getDriverAndBusMarkerData, handleArrival } from './functions/frontendUtils';

// types
import {
    Breakpoint,
    DesktopMobile,
    FocalPoint,
    NRCImage,
    FrameRenderedComponentProps,
    FrameRenderedComponentPropsWithIndex,
    Frame,
    NRCFrameComponent,
    NRCCarouselProps,
    Owner,
    Organization,
    User,
    Passenger,
    Driver,
    Bus,
    Image,
    Trip,
    Seat,
    SeatData,
    Reservation,
    Payment,
    Notification,
    Geofence,
    IncomeExpense,
    Fuel,
    Reminder,
    Tracking,
    GeofenceEvent,
    DriverCardProps,
    ApiResponse,
    DriverData,
    Report,
    Route,
    Message,
    MarkerData,
    KnockRecipient,
    BodyContentBlock,
} from './constants/types';

// Export constants
export {
    LIST_ITEM_VARIANTS,
    CHILD_VARIANTS,
    FADE_IN_VARIANTS,
    MODAL_VARIANTS,
    APP_DOMAIN,
    APP_HOSTNAMES,
    APP_NAME,
    DEFAULT_AVATAR_URL,
    PAGINATION_LIMIT,
    COMPANIES,
    PROCESS,
    PLANS,
    PRICING_FEATURES,
    WORKSPACE_LIMIT,
    NAV_LINKS,
    aeonik,
    inter,
    ROLES,
    ROLE_ORDER,

    // Export enums directly
    MatatuCapacity,
    SeatCategory,
    SeatStatus,
    DriverStatus,
    TripStatus,
    ReservationStatus,
    PaymentStatus,
};

// Export functions
export { cn, isValidUrl, generateMetadata, mapDriverAndBusToMarkerData, getDriverAndBusMarkerData, handleArrival };

// Export types
export type {
    Breakpoint,
    DesktopMobile,
    FocalPoint,
    NRCImage,
    FrameRenderedComponentProps,
    FrameRenderedComponentPropsWithIndex,
    Frame,
    NRCFrameComponent,
    NRCCarouselProps,
    Owner,
    Organization,
    Passenger,
    User,
    Driver,
    Bus,
    Image,
    Trip,
    Seat,
    SeatData,
    Reservation,
    Payment,
    Notification,
    Geofence,
    IncomeExpense,
    Fuel,
    Reminder,
    Tracking,
    GeofenceEvent,
    DriverCardProps,
    ApiResponse,
    DriverData,
    Route,
    Report,
    MarkerData,
    Message,
    KnockRecipient,
    BodyContentBlock,
    // Remove aliased types to avoid confusion
    Role,
    TripStatus as TripStatusType,
    ReservationStatus as ReservationStatusType,
    DriverStatus as DriverStatusType,
};
