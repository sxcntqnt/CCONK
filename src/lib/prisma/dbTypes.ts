import { Prisma } from '@prisma/client';
import {
    User,
    Bus,
    Geofence,
    IncomeExpense,
    Report,
    Trip,
    Role,
    Owner,
    Organization,
    Driver,
    Passenger,
    Reservation,
    Notification,
    Fuel,
    Reminder,
    Tracking,
    GeofenceEvent,
    Image,
    Payment,
    Seat,
    Message,
    TripStatus,
    ReservationStatus,
    DriverStatus,
    MatatuCapacity,
    SeatCategory,
    SeatStatus,
    PaymentStatus,
} from '@/utils';

// Common Select Configurations
const userSelect = {
    id: true,
    clerkId: true,
    firstName: true,
    lastName: true,
    email: true,
    image: true,
    phoneNumber: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};

const busSelect = {
    id: true,
    licensePlate: true,
    capacity: true,
    model: true,
    latitude: true,
    longitude: true,
    lastLocationUpdate: true,
    category: true,
    createdAt: true,
    updatedAt: true,
};

const seatSelect = {
    id: true,
    seatNumber: true,
    price: true,
    row: true,
    column: true,
    category: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};

const tripSelect = {
    id: true,
    busId: true,
    routeId: true,
    destinationIndex: true,
    departureTime: true,
    arrivalTime: true,
    status: true,
    isFullyBooked: true,
    createdAt: true,
    updatedAt: true,
};

const reservationSelect = {
    id: true,
    userId: true,
    tripId: true,
    seatId: true,
    status: true,
    bookedAt: true,
    updatedAt: true,
    successfulPaymentId: true,
};

const notificationSelect = {
    id: true,
    type: true,
    message: true,
    status: true,
    createdAt: true,
    sentAt: true,
    subject: true,
};

const messageSelect = {
    id: true,
    reservationId: true,
    tripId: true,
    content: true,
    timestamp: true,
};

const paymentSelect = {
    id: true,
    reservationId: true,
    amount: true,
    status: true,
    mPesaReceiptNumber: true,
    createdAt: true,
    updatedAt: true,
};

const geofenceSelect = {
    id: true,
    name: true,
    h3Index: true,
    resolution: true,
    geoJson: true,
    color: true,
    createdAt: true,
    updatedAt: true,
};

const ownerSelect = {
    id: true,
    userId: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
};

const organizationSelect = {
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
};

const driverSelect = {
    id: true,
    userId: true,
    busId: true,
    licenseNumber: true,
    status: true,
    hireDate: true,
    rating: true,
    profileImageUrl: true,
    createdAt: true,
    updatedAt: true,
};

const passengerSelect = {
    id: true,
    userId: true,
    busId: true,
    createdAt: true,
    updatedAt: true,
};

// Type Definitions
export type UserWithRelations = Prisma.UserGetPayload<{
    select: {
        id: true;
        clerkId: true;
        firstName: true;
        lastName: true;
        email: true;
        image: true;
        phoneNumber: true;
        role: true;
        createdAt: true;
        updatedAt: true;
        passenger: { select: typeof passengerSelect };
        driver: { select: typeof driverSelect };
        owner: { select: typeof ownerSelect };
        organization: { select: typeof organizationSelect };
        notifications: { select: typeof notificationSelect };
        sentMessages: { select: typeof messageSelect };
        receivedMessages: { select: typeof messageSelect };
        payments: { select: typeof paymentSelect };
        reservations: { select: typeof reservationSelect };
        geofences: { select: typeof geofenceSelect };
    };
}>;

export type PassengerUserWithRelations = {
    id: string;
    clerkId: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
    phoneNumber: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    passenger: { id: string; userId: string; busId: string | null; createdAt: Date; updatedAt: Date } | null;
    reservations: ReservationWithRelations[];
    notifications: NotificationWithRelations[];
    sentMessages: MessageWithRelations[];
    receivedMessages: MessageWithRelations[];
    payments: PaymentWithRelations[];
};

export type OwnerWithRelations = Prisma.OwnerGetPayload<{
    include: {
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        buses: { select: typeof busSelect };
        geofences: { select: typeof geofenceSelect };
        incomeExpenses: {
            select: { id: true; type: true; amount: true; description: true; recordedAt: true; updatedAt: true };
        };
        reports: {
            select: { id: true; title: true; description: true; type: true; generatedAt: true; updatedAt: true };
        };
        notifications: { select: typeof notificationSelect };
        sentMessages: { select: typeof messageSelect };
        receivedMessages: { select: typeof messageSelect };
        organization: { select: typeof organizationSelect };
    };
}>;

export type OrganizationWithRelations = Prisma.OrganizationGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
                email: true;
                image: true;
                role: true;
                phoneNumber: true;
            };
        };
        buses: { select: typeof busSelect };
        owners: { select: typeof ownerSelect };
        notifications: { select: typeof notificationSelect };
        sentMessages: { select: typeof messageSelect };
        receivedMessages: { select: typeof messageSelect };
    };
}>;

export type BusWithRelations = Prisma.BusGetPayload<{
    include: {
        owner: { select: typeof ownerSelect };
        organization: { select: typeof organizationSelect };
        driver: { select: typeof driverSelect };
        passengers: { select: typeof passengerSelect };
        images: { select: { id: true; src: true; blurDataURL: true; alt: true } };
        seats: { select: typeof seatSelect };
        trips: { select: typeof tripSelect };
        fuelRecords: {
            select: {
                id: true;
                fuelQuantity: true;
                odometerReading: true;
                fuelPrice: true;
                fuelFillDate: true;
                fuelAddedBy: true;
                fuelComments: true;
                createdAt: true;
                updatedAt: true;
            };
        };
        reminders: {
            select: {
                id: true;
                date: true;
                message: true;
                title: true;
                isRead: true;
                maintenanceType: true;
                isMaintenance: true;
                createdAt: true;
                updatedAt: true;
            };
        };
        trackingRecords: {
            select: {
                id: true;
                tripId: true;
                time: true;
                latitude: true;
                longitude: true;
                altitude: true;
                speed: true;
                bearing: true;
                accuracy: true;
                provider: true;
                comment: true;
                createdAt: true;
            };
        };
        geofenceEvents: {
            select: {
                id: true;
                geofenceId: true;
                trackingId: true;
                event: true;
                timestamp: true;
                createdAt: true;
                updatedAt: true;
            };
        };
    };
}>;

export type DriverWithRelations = Prisma.DriverGetPayload<{
    include: {
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        bus: { select: typeof busSelect };
        notifications: { select: typeof notificationSelect };
        trips: { select: typeof tripSelect };
        sentMessages: { select: typeof messageSelect };
        receivedMessages: { select: typeof messageSelect };
    };
}>;

export type PassengerWithRelations = Prisma.PassengerGetPayload<{
    include: {
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        bus: { select: typeof busSelect };
        payments: { select: typeof paymentSelect };
        reservations: { select: typeof reservationSelect };
        notifications: { select: typeof notificationSelect };
        sentMessages: { select: typeof messageSelect };
        receivedMessages: { select: typeof messageSelect };
    };
}>;

export type TripWithRelations = Prisma.TripGetPayload<{
    include: {
        bus: {
            select: {
                id: true;
                licensePlate: true;
                capacity: true;
                category: true;
                model: true;
                latitude: true;
                longitude: true;
                lastLocationUpdate: true;
                images: { select: { id: true; src: true; blurDataURL: true; alt: true } };
            };
        };
        driver: { select: typeof driverSelect };
        route: {
            select: {
                id: true;
                route_number: true;
                pickup_point: true;
                destinations: true;
                helix: true;
                createdAt: true;
                updatedAt: true;
            };
        };
        reservations: { select: typeof reservationSelect };
        notifications: { select: typeof notificationSelect };
        messages: {
            select: { id: true; reservationId: true; senderId: true; receiverId: true; content: true; timestamp: true };
        };
        trackingRecords: {
            select: {
                id: true;
                tripId: true;
                time: true;
                latitude: true;
                longitude: true;
                altitude: true;
                speed: true;
                bearing: true;
                accuracy: true;
                provider: true;
                comment: true;
                createdAt: true;
            };
        };
    };
}>;

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                clerkId: true;
                firstName: true;
                lastName: true;
                email: true;
                image: true;
                role: true;
                phoneNumber: true;
                createdAt: true;
                updatedAt: true;
            };
        };
        seat: {
            select: {
                id: true;
                seatNumber: true;
                price: true;
                row: true;
                column: true;
                category: true;
                status: true;
                busId: true;
                bus: {
                    select: {
                        id: true;
                        licensePlate: true;
                        capacity: true;
                        category: true;
                        createdAt: true;
                        updatedAt: true;
                        passengers: { select: typeof passengerSelect };
                        images: { select: { id: true; src: true; blurDataURL: true; alt: true } };
                    };
                };
            };
        };
        trip: {
            select: {
                id: true;
                busId: true;
                routeId: true;
                destinationIndex: true;
                departureTime: true;
                status: true;
                isFullyBooked: true;
                driverId: true;
                createdAt: true;
                updatedAt: true;
                bus: {
                    select: {
                        id: true;
                        licensePlate: true;
                        capacity: true;
                        category: true;
                        images: { select: { id: true; src: true; blurDataURL: true; alt: true } };
                    };
                };
            };
        };
        payments: {
            select: {
                id: true;
                reservationId: true;
                userId: true;
                amount: true;
                status: true;
                mPesaReceiptNumber: true;
                phoneNumber: true;
                createdAt: true;
                updatedAt: true;
                user: { select: typeof userSelect };
                reservation: { select: typeof reservationSelect };
            };
        };
    };
}>;

export type NotificationWithRelations = Prisma.NotificationGetPayload<{
    include: {
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        passenger: { select: typeof passengerSelect };
        driver: { select: typeof driverSelect };
        owner: { select: typeof ownerSelect };
        organization: { select: typeof organizationSelect };
        trip: { select: typeof tripSelect };
    };
}>;

export type FuelWithRelations = Prisma.FuelGetPayload<{
    include: {
        bus: { select: typeof busSelect };
    };
}>;

export type ReminderWithRelations = Prisma.ReminderGetPayload<{
    include: {
        bus: { select: typeof busSelect };
    };
}>;

export type TrackingWithRelations = Prisma.TrackingGetPayload<{
    include: {
        bus: { select: typeof busSelect };
        trip: { select: typeof tripSelect };
        geofenceEvents: {
            select: {
                id: true;
                geofenceId: true;
                trackingId: true;
                event: true;
                timestamp: true;
                createdAt: true;
                updatedAt: true;
            };
        };
    };
}>;

export type GeofenceWithRelations = Prisma.GeofenceGetPayload<{
    include: {
        owner: { select: typeof ownerSelect };
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        geofenceEvents: {
            select: {
                id: true;
                busId: true;
                trackingId: true;
                event: true;
                timestamp: true;
                createdAt: true;
                updatedAt: true;
            };
        };
    };
}>;

export type GeofenceEventWithRelations = Prisma.GeofenceEventGetPayload<{
    include: {
        bus: { select: typeof busSelect };
        geofence: { select: typeof geofenceSelect };
        tracking: {
            select: {
                id: true;
                tripId: true;
                time: true;
                latitude: true;
                longitude: true;
                altitude: true;
                speed: true;
                bearing: true;
                accuracy: true;
                provider: true;
                comment: true;
                createdAt: true;
            };
        };
    };
}>;

export type IncomeExpenseWithRelations = Prisma.IncomeExpenseGetPayload<{
    include: {
        owner: { select: typeof ownerSelect };
    };
}>;

export type ReportWithRelations = Prisma.ReportGetPayload<{
    include: {
        owner: { select: typeof ownerSelect };
    };
}>;

export type ImageWithRelations = Prisma.ImageGetPayload<{
    include: {
        bus: { select: typeof busSelect };
    };
}>;

export type SeatWithRelations = Prisma.SeatGetPayload<{
    include: {
        bus: {
            select: {
                id: true;
                licensePlate: true;
                capacity: true;
                category: true;
                model: true;
                createdAt: true;
                updatedAt: true;
                ownerId: true;
            };
        };
        reservations: { select: typeof reservationSelect };
    };
}>;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
    include: {
        user: { select: { id: true; name: true; email: true; image: true; role: true } };
        passenger: { select: typeof passengerSelect };
        reservation: { select: typeof reservationSelect };
        successfulReservation: { select: typeof reservationSelect };
    };
}>;

export type MessageWithRelations = Prisma.MessageGetPayload<{
    include: {
        reservation: { select: typeof reservationSelect };
        trip: { select: typeof tripSelect };
        sender: { select: { id: true; name: true; email: true; image: true; role: true } };
        receiver: { select: { id: true; name: true; email: true; image: true; role: true } };
        senderPassenger: { select: typeof passengerSelect };
        receiverPassenger: { select: typeof passengerSelect };
        senderDriver: { select: typeof driverSelect };
        receiverDriver: { select: typeof driverSelect };
        senderOwner: { select: typeof ownerSelect };
        receiverOwner: { select: typeof ownerSelect };
        senderOrganization: { select: typeof organizationSelect };
        receiverOrganization: { select: typeof organizationSelect };
    };
}>;

export type RouteWithRelations = Prisma.RouteGetPayload<{
    include: {
        trips: {
            select: {
                id: true;
                busId: true;
                driverId: true;
                destinationIndex: true;
                departureTime: true;
                arrivalTime: true;
                status: true;
                isFullyBooked: true;
                createdAt: true;
                updatedAt: true;
            };
        };
    };
}>;
