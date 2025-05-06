"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const nextjs_1 = require("@clerk/nextjs");
const icons_1 = require("@/utils/constants/icons");
const driverUtils_1 = require("@/utils/functions/driverUtils");
const TripCard_1 = __importDefault(require("@/components/ui/TripCard"));
const RideLayout_1 = __importDefault(require("@/components/ui/RideLayout"));
const TripsPage = () => {
    const { user } = (0, nextjs_1.useUser)();
    const [trips, setTrips] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!user?.id)
            return;
        const fetchTrips = async () => {
            setLoading(true);
            // Mock driverId; replace with actual mapping from user.id
            const result = await (0, driverUtils_1.getActiveTripsForDriver)(1); // Example driverId
            if (result.error) {
                setError(result.error);
            }
            else {
                setTrips(result.data || []);
            }
            setLoading(false);
        };
        fetchTrips();
    }, [user?.id]);
    return (<RideLayout_1.default title="All Trips">
            <div className="px-5 pb-10">
                {loading ? (<div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"/>
                    </div>) : error ? (<p className="text-red-500 text-center">{error}</p>) : trips.length === 0 ? (<div className="flex flex-col items-center justify-center">
                        <image_1.default src={icons_1.images.noResult} alt="No recent trips found" width={160} height={160} className="w-40 h-40 object-contain"/>
                        <p className="text-sm text-gray-600">No recent trips found</p>
                    </div>) : (<div className="space-y-4">
                        {trips.map((trip) => (<TripCard_1.default key={trip.id} trip={trip}/>))}
                    </div>)}
            </div>
        </RideLayout_1.default>);
};
exports.default = TripsPage;
