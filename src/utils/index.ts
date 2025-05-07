// constants
import { LIST_ITEM_VARIANTS, CHILD_VARIANTS, FADE_IN_VARIANTS, MODAL_VARIANTS } from './constants/animation';
import { APP_DOMAIN, APP_HOSTNAMES, APP_NAME } from './constants/site';
import { DEFAULT_AVATAR_URL, PAGINATION_LIMIT, COMPANIES, PROCESS } from './constants/misc';
import { PLANS, PRICING_FEATURES, WORKSPACE_LIMIT } from './constants/pricing';
import { NAV_LINKS } from './constants/nav-links';
import { aeonik, inter } from './constants/fonts';
import { ROLES, ROLE_ORDER, Role } from './constants/roles';

// functions
import { cn } from './functions/cn';
import { isValidUrl } from './functions/urls';
import { generateMetadata } from './functions/metadata';
import {
    getDriverById,
    getBusByDriverId,
    getActiveTripsForDriver,
    createTripReservation,
    getTripIdForDriver,
    updateTripStatus,
    getUsersWithReservations,
    getDriverData,
    getReservationCount,
} from './functions/driverUtils';

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
    User,
    Driver,
    Bus,
    Image,
    Trip,
    Seat,
    Reservation,
    Payment,
    Notification,
    Geofence,
    IncomeExpense,
    DriverCardProps,
    ApiResponse,
    DriverData,
    Report,
    Message,
    TripStatus,
    ReservationStatus,
    DriverStatus,
    MarkerData,
    KnockRecipient,
    BodyContentBlock,
} from './constants/types';

// Export constants and functions
export {
    // constants
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

    // functions
    cn,
    isValidUrl,
    generateMetadata,
    getDriverById,
    getBusByDriverId,
    getDriverAndBusMarkerData,
    mapDriverAndBusToMarkerData,
    getActiveTripsForDriver,
    createTripReservation,
    getTripIdForDriver,
    updateTripStatus,
    getUsersWithReservations,
    getDriverData,
    getReservationCount,
    handleArrival,

    // enums (values)
    TripStatus,
    ReservationStatus,
    DriverStatus,
};

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
    User,
    Driver,
    Bus,
    Image,
    Trip,
    Seat,
    Reservation,
    Payment,
    Notification,
    Geofence,
    IncomeExpense,
    DriverCardProps,
    ApiResponse,
    DriverData,
    Report,
    MarkerData,
    Message,
    TripStatus as TripStatusType,
    ReservationStatus as ReservationStatusType,
    DriverStatus as DriverStatusType,
    KnockRecipient,
    BodyContentBlock,
    Role,
};
