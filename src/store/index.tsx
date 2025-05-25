import { create } from 'zustand';
import {
    Driver,
    Bus,
    User,
    Owner,
    Trip,
    Seat,
    Reservation,
    Payment,
    Notification,
    Report,
    Geofence,
    IncomeExpense,
    Image,
    MarkerData,
    mapDriverAndBusToMarkerData,
    Reminder,
} from '@/utils';

export interface Message {
    id: number;
    reservationId: number;
    tripId: number; // Added to match Prisma schema
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
}

export interface OwnerStore {
    owners: Owner[];
    setOwners: (owners: Owner[]) => void;
}

export interface UserStore {
    users: User[];
    currentUser: User | null;
    setUsers: (users: User[]) => void;
    setCurrentUser: (user: User | null) => void;
}

export interface DriverStore {
    drivers: Driver[];
    selectedDriver: number | null;
    activeStatus: string | null;
    setDrivers: (drivers: Driver[]) => void;
    setSelectedDriver: (driverId: number) => void;
    clearSelectedDriver: () => void;
    setActiveStatus: (status: string | null) => void;
}

export interface BusStore {
    buses: Bus[];
    setBuses: (buses: Bus[]) => void;
    addBus: (bus: Omit<Bus, 'id'>) => void;
}

export interface ImageStore {
    images: Image[];
    setImages: (images: Image[]) => void;
}

export interface TripStore {
    trips: Trip[];
    selectedTrip: number | null;
    setTrips: (trips: Trip[]) => void;
    setSelectedTrip: (tripId: number) => void;
    clearSelectedTrip: () => void;
}

export interface SeatStore {
    seats: Seat[];
    setSeats: (seats: Seat[]) => void;
}

export interface ReservationStore {
    reservations: Reservation[];
    reservationCount: number;
    setReservations: (reservations: Reservation[]) => void;
    setReservationCount: (count: number) => void;
    getUserReservation: (userId: number) => Reservation | undefined;
    getReservationsByTripId: (tripId: number) => Reservation[]; // Added
}

export interface PaymentStore {
    payments: Payment[];
    setPayments: (payments: Payment[]) => void;
}

export interface NotificationStore {
    notifications: Notification[];
    setNotifications: (notifications: Notification[]) => void;
}

export interface ReportStore {
    reports: Report[];
    setReports: (reports: Report[]) => void;
}

export interface GeofenceStore {
    geofences: Geofence[];
    setGeofences: (geofences: Geofence[]) => void;
}

export interface IncomeExpenseStore {
    incomeExpenses: IncomeExpense[];
    setIncomeExpenses: (incomeExpenses: IncomeExpense[]) => void;
}

export interface MessageStore {
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

export interface LocationStore {
    userLatitude: number | null;
    userLongitude: number | null;
    userAddress: string | null;
    destinationLatitude: number | null;
    destinationLongitude: number | null;
    destinationAddress: string | null;
    setUserLocation: (location: { latitude: number; longitude: number; address: string }) => void;
    setDestinationLocation: (location: { latitude: number; longitude: number; address: string }) => void;
}

export const useOwnerStore = create<OwnerStore>((set) => ({
    owners: [],
    setOwners: (owners: Owner[]) => set(() => ({ owners })),
}));

export const useUserStore = create<UserStore>((set) => ({
    users: [],
    currentUser: null,
    setUsers: (users: User[]) => set(() => ({ users })),
    setCurrentUser: (currentUser: User | null) => set(() => ({ currentUser })),
}));

export const useDriverStore = create<DriverStore>((set) => ({
    drivers: [],
    selectedDriver: null,
    activeStatus: null,
    setDrivers: (drivers: Driver[]) => set(() => ({ drivers })),
    setSelectedDriver: (driverId: number) => set(() => ({ selectedDriver: driverId })),
    clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
    setActiveStatus: (status: string | null) => set(() => ({ activeStatus: status })),
}));

export const useBusStore = create<BusStore>((set) => ({
    buses: [],
    setBuses: (buses: Bus[]) => set(() => ({ buses })),
    addBus: (bus: Omit<Bus, 'id'>) =>
        set((state) => ({
            buses: [...state.buses, { ...bus, id: state.buses.length + 1 }],
        })),
}));

export const useImageStore = create<ImageStore>((set) => ({
    images: [],
    setImages: (images: Image[]) => set(() => ({ images })),
}));

export const useTripStore = create<TripStore>((set) => ({
    trips: [],
    selectedTrip: null,
    setTrips: (trips: Trip[]) => set(() => ({ trips })),
    setSelectedTrip: (tripId: number) => set(() => ({ selectedTrip: tripId })),
    clearSelectedTrip: () => set(() => ({ selectedTrip: null })),
}));

export const useSeatStore = create<SeatStore>((set) => ({
    seats: [],
    setSeats: (seats: Seat[]) => set(() => ({ seats })),
}));

export const useReservationStore = create<ReservationStore>((set, get) => ({
    reservations: [],
    reservationCount: 0,
    setReservations: (reservations: Reservation[]) => set(() => ({ reservations })),
    setReservationCount: (count: number) => set(() => ({ reservationCount: count })),
    getUserReservation: (userId: number): Reservation | undefined => {
        const state = get();
        return state.reservations.find((r: Reservation) => r.userId === userId && r.status === 'confirmed');
    },
    getReservationsByTripId: (tripId: number): Reservation[] => {
        const state = get();
        return state.reservations.filter((r: Reservation) => r.tripId === tripId);
    },
}));

export const usePaymentStore = create<PaymentStore>((set) => ({
    payments: [],
    setPayments: (payments: Payment[]) => set(() => ({ payments })),
}));

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    setNotifications: (notifications: Notification[]) => set(() => ({ notifications })),
}));

export const useReportStore = create<ReportStore>((set) => ({
    reports: [],
    setReports: (reports: Report[]) => set(() => ({ reports })),
}));

export const useGeofenceStore = create<GeofenceStore>((set) => ({
    geofences: [],
    setGeofences: (geofences: Geofence[]) => set(() => ({ geofences })),
}));

export const useIncomeExpenseStore = create<IncomeExpenseStore>((set) => ({
    incomeExpenses: [],
    setIncomeExpenses: (incomeExpenses: IncomeExpense[]) => set(() => ({ incomeExpenses })),
}));

export const useMessageStore = create<MessageStore>((set) => ({
    messages: [],
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) =>
        set((state) => ({
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

export const useLocationStore = create<LocationStore>((set) => ({
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
        if (selectedDriver) clearSelectedDriver();
    },
    setDestinationLocation: ({ latitude, longitude, address }) => {
        set(() => ({
            destinationLatitude: latitude,
            destinationLongitude: longitude,
            destinationAddress: address,
        }));
        const { selectedDriver, clearSelectedDriver } = useDriverStore.getState();
        if (selectedDriver) clearSelectedDriver();
    },
}));

interface SettingsState {
    notifications: {
        email: boolean;
        push: boolean;
    };
    theme: 'light' | 'dark';
    setNotifications: (notifications: Partial<SettingsState['notifications']>) => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    notifications: {
        email: true,
        push: true,
    },
    theme: 'dark',
    setNotifications: (notifications) =>
        set((state) => ({
            notifications: { ...state.notifications, ...notifications },
        })),
    setTheme: (theme) => set({ theme }),
}));

// Define the store's state and actions
interface ReminderStore {
    reminders: Reminder[];
    setReminders: (reminders: Reminder[]) => void;
    addReminder: (reminder: Reminder) => void;
    updateReminder: (id: number, updatedReminder: Partial<Reminder>) => void;
    removeReminder: (id: number) => void;
    markAsRead: (id: number, isread: boolean) => void;
}

// Create the Zustand store
export const useReminderStore = create<ReminderStore>((set) => ({
    reminders: [],

    // Set the entire reminders array
    setReminders: (reminders) => set({ reminders }),

    // Add a new reminder
    addReminder: (reminder) =>
        set((state) => ({
            reminders: [...state.reminders, reminder],
        })),

    // Update an existing reminder by ID
    updateReminder: (id, updatedReminder) =>
        set((state) => ({
            reminders: state.reminders.map((reminder) =>
                reminder.id === id ? { ...reminder, ...updatedReminder } : reminder,
            ),
        })),

    // Remove a reminder by ID
    removeReminder: (id) =>
        set((state) => ({
            reminders: state.reminders.filter((reminder) => reminder.id !== id),
        })),

    // Mark a reminder as read/unread
    markAsRead: (id, isread) =>
        set((state) => ({
            reminders: state.reminders.map((reminder) => (reminder.id === id ? { ...reminder, isread } : reminder)),
        })),
}));
