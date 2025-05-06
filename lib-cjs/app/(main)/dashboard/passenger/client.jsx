"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PassengerDashboardClient;
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const link_1 = __importDefault(require("next/link"));
const RTU_1 = __importDefault(require("@/lib/websocket/RTU"));
const nextjs_1 = require("@clerk/nextjs");
const components_1 = require("@/components");
const magic_card_1 = __importDefault(require("@/components/ui/magic-card"));
const separator_1 = require("@/components/ui/separator");
const scroll_area_1 = require("@/components/ui/scroll-area");
const navigation_1 = require("next/navigation");
const store_1 = require("@/store");
// Helper function to format status for display
const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
function PassengerDashboardClient({ userData, passenger, buses, error, role }) {
    const [hasReservations, setHasReservations] = (0, react_1.useState)(null);
    const [reservationCounts, setReservationCounts] = (0, react_1.useState)({});
    const { signOut } = (0, nextjs_1.useClerk)();
    const { isLoaded, isSignedIn, user } = (0, nextjs_1.useUser)();
    const router = (0, navigation_1.useRouter)();
    const { setSelectedDriver, clearSelectedDriver } = (0, store_1.useDriverStore)();
    (0, react_1.useEffect)(() => {
        if (passenger) {
            setHasReservations(passenger.reservations.length > 0);
            // Set driver for the first reservation (optional, for compatibility with DriverDetails)
            if (passenger.reservations.length > 0) {
                const firstReservation = passenger.reservations[0];
                const driverId = parseInt(firstReservation.trip.bus.id.toString());
                setSelectedDriver(driverId);
            }
            else {
                clearSelectedDriver();
            }
            // Fetch reservation counts for each trip
            const fetchReservationCounts = async () => {
                const counts = await Promise.all(passenger.reservations.map(async (reservation) => {
                    try {
                        const response = await fetch(`/api/reservations?tripId=${reservation.tripId}`);
                        if (!response.ok)
                            throw new Error('Failed to fetch reservations');
                        const data = await response.json();
                        return { tripId: reservation.tripId, count: data.reservations.length };
                    }
                    catch (error) {
                        console.error(`Failed to fetch reservations for trip ${reservation.tripId}:`, error);
                        return { tripId: reservation.tripId, count: 0 };
                    }
                }));
                setReservationCounts(counts.reduce((acc, { tripId, count }) => ({ ...acc, [tripId]: count }), {}));
            };
            if (passenger.reservations.length > 0) {
                fetchReservationCounts();
            }
        }
    }, [passenger, setSelectedDriver, clearSelectedDriver]);
    if (!isLoaded) {
        return (<div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">Loading...</p>
            </div>);
    }
    if (!isSignedIn || !userData || error?.includes('Authentication failed') || error?.includes('Please sign in')) {
        router.push('/auth/sign-in');
        return (<div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">Redirecting to sign-in...</p>
            </div>);
    }
    if (error || !passenger || hasReservations === null) {
        return (<div className="flex items-center justify-center flex-col h-screen bg-gray-950">
                <div className="border-[3px] border-gray-800 rounded-full border-t-green-500 animate-spin w-10 h-10"></div>
                <p className="text-lg font-medium text-white mt-4">{error || 'Loading your dashboard...'}</p>
                {error && (<button_1.Button variant="outline" className="mt-4 text-white border-gray-700 hover:bg-gray-600" onClick={() => router.refresh()}>
                        Retry
                    </button_1.Button>)}
            </div>);
    }
    return (<main className="flex-1 bg-gray-950">
            <components_1.MaxWidthWrapper className="py-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">
                    Welcome, {passenger.name || userData.firstName}!
                </h1>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <magic_card_1.default className="p-0 h-full w-full max-w-3xl">
                        <card_1.Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                            <card_1.CardHeader className="p-6">
                                <card_1.CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground/80 group-hover:text-white">
                                    Your Reservations
                                    <span className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full">
                                        {passenger.reservations.length}
                                    </span>
                                </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent className="p-6 pt-0">
                                <scroll_area_1.ScrollArea className="h-40">
                                    {hasReservations ? (passenger.reservations.map((reservation) => (<div key={reservation.id} className="py-3">
                                                <p className="text-base">
                                                    <strong>Bus:</strong> {reservation.trip.bus.licensePlate}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Route:</strong> {reservation.trip.departureCity} →{' '}
                                                    {reservation.trip.arrivalCity}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Departure:</strong>{' '}
                                                    {new Date(reservation.trip.departureTime).toLocaleString()}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Seat:</strong> {reservation.seatId}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Status:</strong> {formatStatus(reservation.trip.status)}
                                                </p>
                                                <p className="text-base">
                                                    <strong>Reservation Status:</strong>{' '}
                                                    {formatStatus(reservation.status)}
                                                </p>
                                                <separator_1.Separator className="my-3 bg-gray-700"/>
                                            </div>))) : (<p className="text-gray-400 text-base">No reservations yet.</p>)}
                                </scroll_area_1.ScrollArea>
                            </card_1.CardContent>
                        </card_1.Card>
                    </magic_card_1.default>

                    <magic_card_1.default className="p-0 h-full w-full max-w-xl">
                        <card_1.Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                            <card_1.CardHeader className="p-6">
                                <card_1.CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground/80 group-hover:text-white">
                                    Available Buses
                                    <span className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full">
                                        {buses.length}
                                    </span>
                                </card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent className="p-6 pt-0">
                                <scroll_area_1.ScrollArea className="h-40">
                                    {buses.length > 0 ? (buses.map((bus) => (<div key={bus.id} className="flex justify-between items-center py-3">
                                                <div>
                                                    <p className="font-semibold text-base">{bus.licensePlate}</p>
                                                    <p className="text-sm text-gray-300">
                                                        Capacity: {bus.capacity} seats
                                                    </p>
                                                </div>
                                                <link_1.default href={`/reserve?busId=${bus.id}`} legacyBehavior>
                                                    <button_1.Button variant="outline" size="sm" className="text-white border-gray-700 hover:bg-gray-600 transition-colors">
                                                        Reserve
                                                    </button_1.Button>
                                                </link_1.default>
                                            </div>))) : (<p className="text-gray-400 text-base">No buses available.</p>)}
                                </scroll_area_1.ScrollArea>
                            </card_1.CardContent>
                        </card_1.Card>
                    </magic_card_1.default>

                    {passenger.reservations.map((reservation) => (<magic_card_1.default key={reservation.tripId} className="p-0 h-full w-full max-w-xl">
                            <card_1.Card className="group bg-gray-900 text-white border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                                <card_1.CardHeader className="p-6">
                                    <card_1.CardTitle className="text-2xl font-semibold text-foreground/80 group-hover:text-white">
                                        Trip Updates
                                    </card_1.CardTitle>
                                </card_1.CardHeader>
                                <card_1.CardContent className="p-6 pt-0">
                                    <scroll_area_1.ScrollArea className="h-40">
                                        <RTU_1.default tripId={reservation.tripId} driverId={reservation.trip.bus.id.toString()}/>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Bus Occupancy: {reservationCounts[reservation.tripId] || 0} of{' '}
                                            {reservation.trip.bus.capacity} seats reserved
                                        </p>
                                    </scroll_area_1.ScrollArea>
                                </card_1.CardContent>
                            </card_1.Card>
                        </magic_card_1.default>))}
                </div>

                <div className="mt-8 flex justify-center gap-4">
                    <link_1.default href="/" legacyBehavior>
                        <button_1.Button variant="outline" className="text-white border-gray-700 hover:bg-gray-600 w-32 transition-colors">
                            Back to Home
                        </button_1.Button>
                    </link_1.default>
                    <button_1.Button onClick={() => signOut({ redirectUrl: '/' })} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 w-32 transition-colors">
                        Sign Out
                    </button_1.Button>
                </div>
            </components_1.MaxWidthWrapper>
        </main>);
}
