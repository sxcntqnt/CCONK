"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocationStore = exports.useMessageStore = exports.useIncomeExpenseStore = exports.useGeofenceStore = exports.useReportStore = exports.useNotificationStore = exports.usePaymentStore = exports.useReservationStore = exports.useSeatStore = exports.useTripStore = exports.useImageStore = exports.useBusStore = exports.useDriverStore = exports.useUserStore = exports.useOwnerStore = exports.mapDriverAndBusToMarkerData = void 0;
const zustand_1 = require("zustand");
const mapDriverAndBusToMarkerData = (driver, bus) => ({
    id: bus.id,
    latitude: bus.latitude || 0,
    longitude: bus.longitude || 0,
    title: `${driver.firstName} ${driver.lastName}`,
    profileImageUrl: driver.profileImageUrl || '/images/default-profile.jpg',
    busImageUrl: bus.images?.[0]?.src || '/images/default-bus.jpg',
    licensePlate: bus.licensePlate,
    capacity: bus.capacity,
    rating: driver.rating || 4.5,
    model: bus.model,
    status: driver.status,
});
exports.mapDriverAndBusToMarkerData = mapDriverAndBusToMarkerData;
exports.useOwnerStore = (0, zustand_1.create)((set) => ({
    owners: [],
    setOwners: (owners) => set(() => ({ owners })),
}));
exports.useUserStore = (0, zustand_1.create)((set) => ({
    users: [],
    currentUser: null,
    setUsers: (users) => set(() => ({ users })),
    setCurrentUser: (currentUser) => set(() => ({ currentUser })),
}));
exports.useDriverStore = (0, zustand_1.create)((set) => ({
    drivers: [],
    selectedDriver: null,
    activeStatus: null,
    setDrivers: (drivers) => set(() => ({ drivers })),
    setSelectedDriver: (driverId) => set(() => ({ selectedDriver: driverId })),
    clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
    setActiveStatus: (status) => set(() => ({ activeStatus: status })),
}));
exports.useBusStore = (0, zustand_1.create)((set) => ({
    buses: [],
    setBuses: (buses) => set(() => ({ buses })),
    addBus: (bus) => set((state) => ({
        buses: [...state.buses, { ...bus, id: state.buses.length + 1 }],
    })),
}));
exports.useImageStore = (0, zustand_1.create)((set) => ({
    images: [],
    setImages: (images) => set(() => ({ images })),
}));
exports.useTripStore = (0, zustand_1.create)((set) => ({
    trips: [],
    selectedTrip: null,
    setTrips: (trips) => set(() => ({ trips })),
    setSelectedTrip: (tripId) => set(() => ({ selectedTrip: tripId })),
    clearSelectedTrip: () => set(() => ({ selectedTrip: null })),
}));
exports.useSeatStore = (0, zustand_1.create)((set) => ({
    seats: [],
    setSeats: (seats) => set(() => ({ seats })),
}));
exports.useReservationStore = (0, zustand_1.create)((set, get) => ({
    reservations: [],
    reservationCount: 0,
    setReservations: (reservations) => set(() => ({ reservations })),
    setReservationCount: (count) => set(() => ({ reservationCount: count })),
    getUserReservation: (userId) => {
        const state = get();
        return state.reservations.find((r) => r.userId === userId && r.status === 'confirmed');
    },
    getReservationsByTripId: (tripId) => {
        const state = get();
        return state.reservations.filter((r) => r.tripId === tripId);
    },
}));
exports.usePaymentStore = (0, zustand_1.create)((set) => ({
    payments: [],
    setPayments: (payments) => set(() => ({ payments })),
}));
exports.useNotificationStore = (0, zustand_1.create)((set) => ({
    notifications: [],
    setNotifications: (notifications) => set(() => ({ notifications })),
}));
exports.useReportStore = (0, zustand_1.create)((set) => ({
    reports: [],
    setReports: (reports) => set(() => ({ reports })),
}));
exports.useGeofenceStore = (0, zustand_1.create)((set) => ({
    geofences: [],
    setGeofences: (geofences) => set(() => ({ geofences })),
}));
exports.useIncomeExpenseStore = (0, zustand_1.create)((set) => ({
    incomeExpenses: [],
    setIncomeExpenses: (incomeExpenses) => set(() => ({ incomeExpenses })),
}));
exports.useMessageStore = (0, zustand_1.create)((set) => ({
    messages: [],
    addMessage: (message) => set((state) => ({
        messages: [
            ...state.messages,
            {
                ...message,
                id: state.messages.length + 1,
                timestamp: new Date().toISOString(),
            },
        ],
    })),
}));
exports.useLocationStore = (0, zustand_1.create)((set) => ({
    userLatitude: null,
    userLongitude: null,
    userAddress: null,
    destinationLatitude: null,
    destinationLongitude: null,
    destinationAddress: null,
    setUserLocation: ({ latitude, longitude, address }) => {
        set(() => ({
            userLatitude: latitude,
            userLongitude: longitude,
            userAddress: address,
        }));
        const { selectedDriver, clearSelectedDriver } = exports.useDriverStore.getState();
        if (selectedDriver)
            clearSelectedDriver();
    },
    setDestinationLocation: ({ latitude, longitude, address }) => {
        set(() => ({
            destinationLatitude: latitude,
            destinationLongitude: longitude,
            destinationAddress: address,
        }));
        const { selectedDriver, clearSelectedDriver } = exports.useDriverStore.getState();
        if (selectedDriver)
            clearSelectedDriver();
    },
}));
