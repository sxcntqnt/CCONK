"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DriverDashboard;
// src/app/(main)/dashboard/driver/page.tsx
const server_1 = require("@clerk/nextjs/server");
const navigation_1 = require("next/navigation");
const card_1 = require("@/components/ui/card");
const react_1 = require("react");
const RTU_1 = __importDefault(require("@/lib/websocket/RTU"));
const roles_1 = require("@/utils/constants/roles");
const driverUtils_1 = require("@/utils/functions/driverUtils");
async function DriverDashboard() {
    const user = await (0, server_1.currentUser)();
    // Redirect if user is not authenticated
    if (!user) {
        (0, navigation_1.redirect)('/auth/sign-in');
    }
    // Normalize and validate role
    const rawRole = user.unsafeMetadata.role;
    const role = rawRole?.toUpperCase().trim();
    if (!role) {
        (0, navigation_1.redirect)('/');
    }
    // Redirect based on role
    switch (role) {
        case roles_1.ROLES.PASSENGER:
            (0, navigation_1.redirect)('/dashboard/passenger');
        case roles_1.ROLES.OWNER:
            (0, navigation_1.redirect)('/dashboard/owner');
        case roles_1.ROLES.DRIVER:
            break;
        default:
            (0, navigation_1.redirect)('/');
    }
    // Fetch driver data
    let driverData;
    try {
        driverData = await (0, driverUtils_1.getDriverData)(user.id);
    }
    catch (error) {
        console.error('Error fetching driver data:', error);
        return (<div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load driver data'}</p>
            </div>);
    }
    // Check if driverData.data exists
    if (!driverData.data) {
        return (<div className="container mx-auto py-8">
                <p>No driver data available</p>
            </div>);
    }
    // Destructure driver and trip from driverData.data
    const { driver, trip } = driverData.data;
    // Handle invalid driver data
    if (!driver) {
        return (<div className="container mx-auto py-8">
                <p>Invalid driver data</p>
            </div>);
    }
    // Handle no active trip
    if (!trip) {
        return (<div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
                <card_1.Card>
                    <card_1.CardHeader>
                        <card_1.CardTitle>No Active Trip</card_1.CardTitle>
                    </card_1.CardHeader>
                    <card_1.CardContent>
                        <p>You have no active trips assigned at the moment.</p>
                    </card_1.CardContent>
                </card_1.Card>
            </div>);
    }
    // Fetch reservation count
    const reservationCount = await (0, driverUtils_1.getReservationCount)(trip.id);
    return (<div className="flex">
            <div className="container mx-auto py-8 flex-1">
                <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <card_1.Card className="w-full">
                        <card_1.CardHeader>
                            <card_1.CardTitle>Active Trip #{trip.id}</card_1.CardTitle>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Bus</p>
                                <p className="text-lg">
                                    {trip.bus?.licensePlate ?? 'N/A'} (Capacity: {trip.bus?.capacity ?? 'N/A'})
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Route</p>
                                <p className="text-lg">
                                    {trip.departureCity ?? 'N/A'} → {trip.arrivalCity ?? 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Departure</p>
                                <p className="text-lg">
                                    {trip.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Bus Occupancy</p>
                                <p className="text-lg">
                                    {reservationCount.data ?? 0} of {trip.bus?.capacity ?? 'N/A'} seats reserved
                                </p>
                            </div>
                        </card_1.CardContent>
                    </card_1.Card>
                    <react_1.Suspense fallback={<card_1.Card>
                                <card_1.CardContent>Loading reservation updates...</card_1.CardContent>
                            </card_1.Card>}>
                        <RTU_1.default tripId={trip.id} driverId={trip.bus?.id.toString() ?? '0'}/>
                    </react_1.Suspense>
                </div>
            </div>
        </div>);
}
