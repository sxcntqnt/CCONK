"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const nextjs_1 = require("@clerk/nextjs");
const constants_1 = require("@/constants");
const rideUtils_1 = require("@/lib/rideUtils");
// RideCard component updated to use Ride type from rideUtils
const RideCard = ({ ride }) => (<div className="bg-white p-4 mb-4 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-lg font-JakartaBold">{ride.destination_address}</h3>
    <p className="text-sm text-gray-600">Date: {new Date(ride.created_at).toLocaleDateString()}</p>
    <p className="text-sm text-gray-600">Ride ID: {ride.ride_id}</p>
    <p className="text-sm text-gray-600">
      Driver: {ride.driver.first_name} {ride.driver.last_name}
    </p>
  </div>);
const RidesPage = () => {
    const { user } = (0, nextjs_1.useUser)();
    const [recentRides, setRecentRides] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!user?.id)
            return;
        const fetchRides = async () => {
            setLoading(true);
            const result = await (0, rideUtils_1.getRecentRides)(user.id);
            if (result.error) {
                setError(result.error);
            }
            else {
                setRecentRides(result.data || []);
            }
            setLoading(false);
        };
        fetchRides();
    }, [user?.id]);
    return (<div className="flex-1 bg-white min-h-screen">
      <div className="px-5 pb-24">
        <h1 className="text-2xl font-JakartaBold my-5">All Rides</h1>
        {loading ? (<div className="flex justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full"/>
          </div>) : error ? (<p className="text-red-500 text-center">{error}</p>) : recentRides.length === 0 ? (<div className="flex flex-col items-center justify-center">
            <image_1.default src={constants_1.images.noResult} alt="No recent rides found" width={160} height={160} className="w-40 h-40 object-contain"/>
            <p className="text-sm text-gray-600">No recent rides found</p>
          </div>) : (<div className="space-y-4">
            {recentRides.map((ride, index) => (<RideCard key={index} ride={ride}/>))}
          </div>)}
      </div>
    </div>);
};
exports.default = RidesPage;
