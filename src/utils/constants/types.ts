import { StaticImageData } from 'next/image';
import { GeoJSON } from 'geojson';
import { Recipient, ContentBlock } from '@knocklabs/client';
import { ROLES, Role } from './roles';
import {
    MatatuCapacity,
    SeatCategory,
    SeatStatus,
    DriverStatus,
    TripStatus,
    ReservationStatus,
    PaymentStatus,
} from '@prisma/client';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
    key: string;
    mobile?: NRCFrameComponent;
    desktop?: NRCFrameComponent;
};

export type NRCFrameComponent = {
    image?: Partial<StaticImageData> & NRCImage;
    component?: React.ReactNode | ((props: FrameRenderedComponentPropsWithIndex) => React.ReactNode);
};

export type NRCCarouselProps = {
    frames: Frame[];
    heights?: DesktopMobile<number>;
    breakpoint?: Breakpoint;
    slideDuration?: number;
    noAutoPlay?: boolean;
    loadingComponent?: React.ReactNode;
    blurQuality?: number;
    noBlur?: boolean;
    ariaLabel?: string;
    controlsComponent?: (props: FrameRenderedComponentPropsWithIndex) => React.ReactNode;
    willAutoPlayOutsideViewport?: boolean;
};

export type User = {
    id: string;
    clerkId: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string;
    phoneNumber?: string;
    role: Role;
    notifications?: Notification[];
    sentMessages?: Message[];
    receivedMessages?: Message[];
    passenger?: Passenger;
    driver?: Driver;
    owner?: Owner;
    organization?: Organization;
    payments?: Payment[];
    reservations?: Reservation[];
    geofences?: Geofence[];
    createdAt: Date;
    updatedAt: Date;
};

export type Owner = {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    buses: Bus[];
    geofences: Geofence[];
    incomeExpenses: IncomeExpense[];
    reports: Report[];
    notifications?: Notification[];
    sentMessages?: Message[];
    receivedMessages?: Message[];
    organizationId?: string;
    organization?: Organization;
};

export type Organization = {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    buses: Bus[];
    owners: Owner[];
    notifications?: Notification[];
    sentMessages?: Message[];
    receivedMessages?: Message[];
};

export type Bus = {
    id: string;
    licensePlate: string;
    capacity: number;
    model?: string;
    latitude?: number;
    longitude?: number;
    lastLocationUpdate?: Date;
    createdAt: Date;
    updatedAt: Date;
    category: MatatuCapacity;
    ownerId?: string;
    owner?: Owner;
    organizationId?: string;
    organization?: Organization;
    driverId?: string;
    driver?: Driver;
    passengers: Passenger[];
    images: Image[];
    seats?: Seat[];
    trips?: Trip[];
    fuelRecords?: Fuel[];
    reminders?: Reminder[];
    trackingRecords?: Tracking[];
    geofenceEvents?: GeofenceEvent[];
};

export type Driver = {
    id: string;
    userId: string;
    busId?: string;
    licenseNumber: string;
    status: DriverStatus;
    hireDate?: Date;
    rating?: number;
    profileImageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    bus?: Bus;
    notifications?: Notification[];
    trips?: Trip[];
    sentMessages?: Message[];
    receivedMessages?: Message[];
};

export type Passenger = {
    id: string;
    userId: string;
    busId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    bus?: Bus;
    payments?: Payment[];
    reservations?: Reservation[];
    notifications?: Notification[];
    sentMessages?: Message[];
    receivedMessages?: Message[];
};

export type Route = {
    id: string;
    route_number: string;
    pickup_point: {
        pickup_point: string;
        pickup_latlng: { latitude: number; longitude: number };
        pickup_hexid: string;
    };
    destinations: {
        destination: string;
        destination_latlng: { latitude: number; longitude: number };
        destination_hexid: string;
    }[];
    helix: string[];
    createdAt: Date;
    updatedAt: Date;
    trips?: Trip[];
};

export type Trip = {
    id: string;
    busId: string;
    driverId?: string;
    routeId: string;
    destinationIndex: number;
    departureTime: Date;
    arrivalTime?: Date;
    status: TripStatus;
    isFullyBooked: boolean;
    createdAt: Date;
    updatedAt: Date;
    bus: {
        id: string;
        licensePlate: string;
        capacity: number;
        category: MatatuCapacity;
        images: Image[];
    };
    driver?: Driver;
    route?: Route;
    reservations?: Reservation[];
    notifications?: Notification[];
    messages?: Message[];
    trackingRecords?: Tracking[];
};

export type Reservation = {
    id: string;
    userId: string;
    tripId: string;
    seatId: string;
    status: ReservationStatus;
    bookedAt: Date;
    updatedAt: Date;
    successfulPaymentId?: string;
    trip: Trip;
    seat: Seat;
    user: User;
    passenger?: Passenger;
    successfulPayment?: Payment;
    payments: Payment[];
    messages?: Message[];
};

export type Payment = {
    id: string;
    reservationId: string;
    userId: string;
    amount: number;
    mPesaReceiptNumber?: string;
    merchantRequestId?: string;
    checkoutRequestId?: string;
    resultCode?: number;
    resultDesc?: string;
    balance?: number;
    phoneNumber: string | null;
    status: PaymentStatus;
    transactionDate?: Date;
    callbackMetadata?: any;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    passenger?: Passenger;
    reservation: Reservation;
    successfulReservation?: Reservation;
};

export type Notification = {
    id: string;
    userId: string;
    tripId?: string;
    type: string;
    message: string;
    status: string;
    createdAt: Date;
    sentAt?: Date;
    driverId?: string;
    subject: string;
    driver?: Driver;
    trip?: Trip;
    user: User;
    passenger?: Passenger;
    owner?: Owner;
    organization?: Organization;
};

export type Fuel = {
    id: string;
    busId: string;
    fuelQuantity: number;
    odometerReading: number;
    fuelPrice: number;
    fuelFillDate: Date;
    fuelAddedBy: string;
    fuelComments?: string;
    createdAt: Date;
    updatedAt: Date;
    bus: {
        id: string;
        licensePlate: string;
    };
};

export type Reminder = {
    id: string;
    busId: string;
    date: Date;
    message: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
    maintenanceType?: string;
    isMaintenance: boolean;
    bus: {
        id: string;
        licensePlate: string;
    };
};

export type Tracking = {
    id: string;
    busId: string;
    tripId?: string;
    time: Date;
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    bearing?: number;
    accuracy?: number;
    provider?: string;
    comment?: string;
    createdAt: Date;
    bus: {
        id: string;
        licensePlate: string;
    };
    trip?: Trip;
    geofenceEvents?: GeofenceEvent[];
};

export type Geofence = {
    id: string;
    ownerId?: string;
    userId?: string;
    name: string;
    h3Index: string;
    resolution: number;
    geoJson: any;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    owner?: Owner;
    user?: User;
    geofenceEvents?: GeofenceEvent[];
};

export type GeofenceEvent = {
    id: string;
    busId: string;
    geofenceId: string;
    trackingId?: string;
    event: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
    bus: {
        id: string;
        licensePlate: string;
    };
    geofence: {
        id: string;
        name: string;
    };
    tracking?: Tracking;
};

export type IncomeExpense = {
    id: string;
    ownerId: string;
    type: string;
    amount: number;
    description?: string;
    recordedAt: string;
    updatedAt: string;
    owner: Owner;
};

export type Report = {
    id: string;
    ownerId: string;
    title: string;
    description?: string;
    type: string;
    data?: Record<string, any>;
    generatedAt: string;
    updatedAt: string;
    owner: Owner;
};

export type Image = {
    id: string;
    busId: string;
    src: string;
    blurDataURL?: string | null;
    alt: string;
    bus?: Bus;
};

export type Message = {
    id: string;
    reservationId: string;
    tripId: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    deletedAt?: Date;
    reservation: Reservation;
    trip: Trip;
    sender: User;
    receiver: User;
    senderPassenger?: Passenger;
    receiverPassenger?: Passenger;
    senderDriver?: Driver;
    receiverDriver?: Driver;
    senderOwner?: Owner;
    receiverOwner?: Owner;
    senderOrganization?: Organization;
    receiverOrganization?: Organization;
};

export type Seat = {
    id: string;
    busId: string;
    seatNumber: number;
    price: number;
    row: number;
    column: number;
    category: SeatCategory;
    status: SeatStatus;
    bus: Bus;
    reservations?: Reservation[];
};

export type DriverCardProps = {
    item: {
        id: string;
        title: string;
        profileImageUrl: string;
        busImageUrl: string;
        licensePlate: string;
        capacity: number;
        rating: number;
        latitude: number;
        longitude: number;
        model?: string;
        status?: DriverStatus;
    };
    selected: string;
    setSelected: () => void;
};

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

export interface DriverData {
    driver: Driver;
    trip: Trip | null;
    reservations: Reservation[];
    fuelRecords: Fuel[];
}

export interface MarkerData {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    profileImageUrl: string;
    busImageUrl: string;
    licensePlate: string;
    capacity: number;
    rating: number;
    model?: string;
    status?: DriverStatus;
}

export type KnockRecipient = Recipient & {
    firstName: string;
    lastName: string;
};

export type BodyContentBlock = ContentBlock & {
    name: 'body';
    rendered: string;
};

export type SeatData = {
    id: string;
    busId: string;
    label: string;
    status: SeatStatus;
    price: number;
    row?: number;
    column?: number;
    category?: SeatCategory;
    reservation?: {
        id: string;
        tripId: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        status: ReservationStatus;
    };
};
