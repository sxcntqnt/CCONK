"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const TripCard_1 = __importDefault(require("@/components/ui/TripCard"));
const RideLayout_1 = __importDefault(require("@/components/ui/RideLayout"));
const driverUtils_1 = require("@/utils/functions/driverUtils");
const TripDetailsPage = () => {
    const { id } = (0, navigation_1.useParams)();
    const [trip, setTrip] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTrip = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch trips for a driver (replace driverId with actual logic to get driver ID)
                const driverId = 1; // TODO: Replace with dynamic driver ID (e.g., from auth or store)
                const result = await (0, driverUtils_1.getActiveTripsForDriver)(driverId);
                if (result.error) {
                    setError(result.error);
                    return;
                }
                const foundTrip = result.data?.find((t) => t.id === Number(id));
                if (foundTrip) {
                    setTrip(foundTrip);
                }
                else {
                    setError("Trip not found");
                }
            }
            catch (err) {
                setError("Failed to fetch trip details. Please try again later.");
            }
            finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchTrip();
        }
        else {
            setError("Invalid trip ID");
            setLoading(false);
        }
    }, [id]);
    return (<RideLayout_1.default title={`Trip ${id}`}>
      <div className="px-5 pb-10">
        {loading ? (<div className="flex justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"/>
          </div>) : error ? (<p className="text-red-500 text-center">{error}</p>) : trip ? (<TripCard_1.default trip={trip}/>) : (<p className="text-gray-600 text-center">No trip data available</p>)}
      </div>
    </RideLayout_1.default>);
};
exports.default = TripDetailsPage;
