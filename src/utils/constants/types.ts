import { StaticImageData } from 'next/image';
import { MarkerData } from '@/store';
import { GeoJSON } from 'geojson';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type DesktopMobile<T extends string | number> = {
    desktop?: T;
    mobile?: T;
};

export type FocalPoint = {
    x: number;
    y: number;
};

export type NRCImage = {
    alt?: string;
    imageFocalPoint?: FocalPoint;
};

export type FrameRenderedComponentProps = {
    incrementCarousel: () => void;
    decrementCarousel: () => void;
    jumpTo: (index: number) => void;
};

export type FrameRenderedComponentPropsWithIndex = FrameRenderedComponentProps & {
    currentIndex: number;
};

export type Frame = {
    /* The key will default to frame.default.src if this is blank */
    key?: string;
    mobile?: NRCFrameComponent;
    desktop?: NRCFrameComponent;
};
export type NRCFrameComponent = {
    image?: Partial<StaticImageData> & NRCImage;
    /* This component will be absolutely positioned on top of the image. */
    component?: React.ReactNode | ((props: FrameRenderedComponentPropsWithIndex) => React.ReactNode);
};

export type NRCCarouselProps = {
    /* Frames will default to the aspect ratio of the first image, they must all be the same ratio unless you use "heights". */
    frames: Frame[];
    /* This will override the strict resolution mandate, allowing you to choose a height that the Frames will conform to. Not recommend. */
    heights?: DesktopMobile<number>;
    /* The point at which the Carousel will switch to Desktop components. If this is not set the mobile option will be defaulted. */
    breakpoint?: Breakpoint;
    slideDuration?: number;
    noAutoPlay?: boolean;
    /* This component will be displayed before the images load in an absolutely positioned container with gull width and height. */
    loadingComponent?: React.ReactNode;
    /* This is the blur quality of the initial blurred image 1-100, the trade off is performance verse beauty. */
    blurQuality?: number;
    noBlur?: boolean;
    ariaLabel?: string;
    controlsComponent?: (props: FrameRenderedComponentPropsWithIndex) => React.ReactNode;
    willAutoPlayOutsideViewport?: boolean;
};

export type Owner = {
    id: number;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    profileImageUrl: string;
    buses: Bus[];
    geofences: Geofence[];
    incomeExpenses: IncomeExpense[];
    user: User;
    reports: Report[];
};

export type User = {
    id: number;
    clerkId: string;
    name: string;
    email: string;
    image: string;
    phoneNumber?: string;
    role: string;
};

export interface Driver {
    id: number;
    busId?: number;
    userId: number;
    licenseNumber: string;
    status: 'ACTIVE' | 'OFFLINE';
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string;
    rating?: number;
}

export interface Bus {
    id: number;
    licensePlate: string;
    capacity: number;
    model?: string;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: string;
    category: string;
    images: { src: string; alt: string }[];
}

export type Image = {
    id: number;
    busId: number;
    src: string;
    blurDataURL?: string;
    alt: string;
};

export interface Trip {
    id: number;
    busId: number;
    driverId?: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime?: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    isFullyBooked: boolean;
    originLatitude?: number;
    originLongitude?: number;
    destinationLatitude?: number;
    destinationLongitude?: number;
    createdAt: string;
    updatedAt: string;
    bus?: Bus;
}

export type Seat = {
    id: number;
    busId: number;
    seatNumber: number;
    price: number;
    row: number;
    column: number;
    category: string;
    status: string;
};

export type Reservation = {
    id: number;
    userId: number;
    tripId: number;
    seatId: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    bookedAt: string;
    updatedAt: string;
    paymentId?: number;
};

export type Payment = {
    id: number;
    userId: number;
    amount: number;
    transactionId: string;
    phoneNumber: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    transactionDate?: string;
};

export type Notification = {
    id: number;
    userId: number;
    tripId?: number;
    type: string;
    message: string;
    status: string;
    createdAt: string;
    sentAt?: string;
    driverId?: number;
    subject: string;
};

export interface Geofence {
    id: number;
    ownerId?: number | null;
    userId?: number | null;
    name: string;
    h3Index: string;
    resolution: number;
    geoJson: GeoJSON;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    owner?: Owner | null;
    user?: User | null;
}

export interface IncomeExpense {
    id: number;
    ownerId: number;
    type: string;
    amount: number;
    description?: string;
    recordedAt: Date;
    updatedAt: Date;
    owner: Owner;
}

export interface Report {
    id: number;
    ownerId: number;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DriverCardProps {
    item: MarkerData;
    selected: number;
    setSelected: () => void;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

export interface DriverData {
    driver: Driver;
    trip: Trip | null;
}

export interface Message {
    id: number;
    reservationId: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
}
export enum TripStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
}

export enum DriverStatus {
    ACTIVE = 'ACTIVE',
    OFFLINE = 'OFFLINE',
}
