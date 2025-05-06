import { create } from 'zustand';
export const mapDriverAndBusToMarkerData = (driver, bus) => ({
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
export const useOwnerStore = create((set) => ({
    owners: [],
    setOwners: (owners) => set(() => ({ owners })),
}));
export const useUserStore = create((set) => ({
    users: [],
    currentUser: null,
    setUsers: (users) => set(() => ({ users })),
    setCurrentUser: (currentUser) => set(() => ({ currentUser })),
}));
export const useDriverStore = create((set) => ({
    drivers: [],
    selectedDriver: null,
    activeStatus: null,
    setDrivers: (drivers) => set(() => ({ drivers })),
    setSelectedDriver: (driverId) => set(() => ({ selectedDriver: driverId })),
    clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
    setActiveStatus: (status) => set(() => ({ activeStatus: status })),
}));
export const useBusStore = create((set) => ({
    buses: [],
    setBuses: (buses) => set(() => ({ buses })),
    addBus: (bus) => set((state) => ({
        buses: [...state.buses, { ...bus, id: state.buses.length + 1 }],
    })),
}));
export const useImageStore = create((set) => ({
    images: [],
    setImages: (images) => set(() => ({ images })),
}));
export const useTripStore = create((set) => ({
    trips: [],
    selectedTrip: null,
    setTrips: (trips) => set(() => ({ trips })),
    setSelectedTrip: (tripId) => set(() => ({ selectedTrip: tripId })),
    clearSelectedTrip: () => set(() => ({ selectedTrip: null })),
}));
export const useSeatStore = create((set) => ({
    seats: [],
    setSeats: (seats) => set(() => ({ seats })),
}));
export const useReservationStore = create((set, get) => ({
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
export const usePaymentStore = create((set) => ({
    payments: [],
    setPayments: (payments) => set(() => ({ payments })),
}));
export const useNotificationStore = create((set) => ({
    notifications: [],
    setNotifications: (notifications) => set(() => ({ notifications })),
}));
export const useReportStore = create((set) => ({
    reports: [],
    setReports: (reports) => set(() => ({ reports })),
}));
export const useGeofenceStore = create((set) => ({
    geofences: [],
    setGeofences: (geofences) => set(() => ({ geofences })),
}));
export const useIncomeExpenseStore = create((set) => ({
    incomeExpenses: [],
    setIncomeExpenses: (incomeExpenses) => set(() => ({ incomeExpenses })),
}));
export const useMessageStore = create((set) => ({
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
export const useLocationStore = create((set) => ({
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
        const { selectedDriver, clearSelectedDriver } = useDriverStore.getState();
        if (selectedDriver)
            clearSelectedDriver();
    },
    setDestinationLocation: ({ latitude, longitude, address }) => {
        set(() => ({
            destinationLatitude: latitude,
            destinationLongitude: longitude,
            destinationAddress: address,
        }));
        const { selectedDriver, clearSelectedDriver } = useDriverStore.getState();
        if (selectedDriver)
            clearSelectedDriver();
    },
}));
