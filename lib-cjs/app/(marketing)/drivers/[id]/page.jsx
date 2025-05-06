"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("next/navigation");
const store_1 = require("@/store");
const image_1 = __importDefault(require("next/image"));
const names_1 = require("@/lib/names");
const react_1 = require("react");
const notify_driver_arrival_1 = require("@/actions/notify-driver-arrival");
const notify_driver_status_1 = require("@/actions/notify-driver-status");
const progressbar_1 = __importDefault(require("@/components/ui/progressbar"));
// RideLayout component
const RideLayout = ({ title, children }) => (<div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    {children}
  </div>);
// CustomButton component with active state
const CustomButton = ({ title, onPress, disabled, isActive }) => (<button className={`flex-1 py-3 text-white rounded-lg transition ${disabled
        ? "bg-gray-400 cursor-not-allowed"
        : isActive
            ? "bg-green-600"
            : "bg-blue-600 hover:bg-blue-700"}`} onClick={onPress} disabled={disabled} aria-pressed={isActive}>
    {title}
  </button>);
const DriverDetails = ({ driverId }) => {
    const router = (0, navigation_1.useRouter)();
    const { drivers, selectedDriver, activeStatus, setActiveStatus, reservationCount } = (0, store_1.useDriverStore)();
    const [progress, setProgress] = (0, react_1.useState)(0);
    // Find driver details based on driverId
    const driverDetails = drivers.find((driver) => driver.id === parseInt(driverId)) || {
        id: 0,
        title: "Select a Driver",
        profileImageUrl: "/default-profile.png",
        busImageUrl: "/images/default-bus.jpg",
        licensePlate: "N/A",
        capacity: 0,
        rating: 0,
        latitude: 0,
        longitude: 0,
    };
    // Calculate progress based on reservationCount and capacity
    (0, react_1.useEffect)(() => {
        if (driverDetails.capacity > 0) {
            const calculatedProgress = (reservationCount / driverDetails.capacity) * 100;
            setProgress(Math.min(Math.max(calculatedProgress, 0), 100));
        }
        else {
            setProgress(0);
        }
    }, [reservationCount, driverDetails.capacity]);
    // Mock user and address data
    const userAddress = "123 Pickup St, City";
    const destinationAddress = "456 Dropoff Ave, City";
    // Trigger browser notification and server-side notification
    const triggerNotification = async (status, destination) => {
        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.warn("Notification permission denied");
                return;
            }
        }
        const notificationBody = status === "arrived"
            ? `Driver has ${status} at ${destination}.`
            : `Driver is now ${status}.`;
        new Notification("Driver Status Update", {
            body: notificationBody,
            icon: "/icons/notification.png",
        });
        const formData = new FormData();
        if (status === "arrived" && destination) {
            formData.append("destination", destination);
            formData.append("message", `Driver ${driverDetails.title} has arrived at ${destination}.`);
        }
        else {
            formData.append("message", `Driver ${driverDetails.title} is now ${status}.`);
        }
        try {
            if (status === "offline") {
                await (0, notify_driver_status_1.notifyDriverOffline)(formData);
            }
            else if (status === "in-transit") {
                await (0, notify_driver_status_1.notifyDriverInTransit)(formData);
            }
            else if (status === "arrived") {
                await (0, notify_driver_arrival_1.notifyDriverArrival)(formData);
            }
            console.log(`Server-side ${status} notification sent successfully`);
        }
        catch (error) {
            console.error(`Failed to send ${status} notification:`, error);
            new Notification("Notification Error", {
                body: `Failed to send ${status} notification. Please try again.`,
            });
        }
    };
    // Handle status button clicks
    const handleStatusChange = async (status, route) => {
        setActiveStatus(status);
        router.push(route);
        await triggerNotification(status, status === "arrived" ? destinationAddress : undefined);
        // Send status update to server via API
        try {
            const response = await fetch('/api/status-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, driverId, destination: status === "arrived" ? destinationAddress : undefined }),
            });
            if (!response.ok)
                throw new Error('Failed to send status update');
        }
        catch (error) {
            console.error('Failed to send status update:', error);
        }
    };
    if (!selectedDriver || selectedDriver !== parseInt(driverId)) {
        return (<RideLayout title="Driver Details">
        <p className="text-red-500">No driver selected.</p>
      </RideLayout>);
    }
    return (<RideLayout title="Driver Details">
      <div className="space-y-6">
        {/* Driver Profile Section */}
        <div className="flex flex-col items-center justify-center mt-10">
          <image_1.default src={driverDetails.profileImageUrl} alt="Driver Profile" width={112} height={112} className="rounded-full"/>
          <div className="flex flex-row items-center justify-center mt-5 space-x-2">
            <span className="text-lg font-semibold">{driverDetails.title}</span>
            <div className="flex flex-row items-center space-x-0.5">
              <image_1.default src="/icons/star.png" alt="Rating Star" width={20} height={20} className="inline-block"/>
              <span className="text-lg">{driverDetails.rating}</span>
            </div>
          </div>
        </div>

        {/* Ride Details Section */}
        <div className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-gray-100 mt-5">
          <div className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <span className="text-lg">Ride Price</span>
            <span className="text-lg text-green-500">$0</span>
          </div>
          <div className="flex flex-row items-center justify-between w-full border-b border-white py-3">
            <span className="text-lg">Pickup Time</span>
            <span className="text-lg">{(0, names_1.formatTimeOfDay)(new Date().toISOString())}</span>
          </div>
          <div className="flex flex-row items-center justify-between w-full py-3">
            <span className="text-lg">Car seats</span>
            <span className="text-lg">{driverDetails.capacity}</span>
          </div>
        </div>

        {/* Address Section */}
        <div className="flex flex-col w-full items-start justify-center mt-5">
          <div className="flex flex-row items-center justify-start mt-3 border-t border-b border-gray-300 w-full py-3">
            <image_1.default src="/icons/to.png" alt="Pickup Icon" width={24} height={24}/>
            <span className="text-lg ml-2">{userAddress}</span>
          </div>
          <div className="flex flex-row items-center justify-start border-b border-gray-300 w-full py-3">
            <image_1.default src="/icons/point.png" alt="Destination Icon" width={24} height={24}/>
            <span className="text-lg ml-2">{destinationAddress}</span>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-2">Bus Occupancy</h2>
          <progressbar_1.default progress={progress} height="12px" barColor="bg-gray-200" fillColor="bg-green-600" className="w-full"/>
          <p className="text-sm text-gray-600 mt-1">
            {reservationCount} of {driverDetails.capacity} seats reserved ({Math.round(progress)}%)
          </p>
        </div>

        {/* Status Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <CustomButton title="Offline" onPress={() => handleStatusChange("offline", "/offline")} disabled={activeStatus !== null && activeStatus !== "offline"} isActive={activeStatus === "offline"}/>
          <CustomButton title="In-Transit" onPress={() => handleStatusChange("in-transit", "/in-transit")} disabled={activeStatus !== null && activeStatus !== "in-transit"} isActive={activeStatus === "in-transit"}/>
          <CustomButton title="Arrived at Destination" onPress={() => handleStatusChange("arrived", "/arrived-at-destination")} disabled={activeStatus !== null && activeStatus !== "arrived"} isActive={activeStatus === "arrived"}/>
        </div>
      </div>
    </RideLayout>);
};
exports.default = DriverDetails;
