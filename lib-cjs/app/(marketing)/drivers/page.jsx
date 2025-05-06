"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("next/navigation");
const store_1 = require("@/store");
const react_1 = require("react");
const DriverCard_1 = __importDefault(require("@/components/ui/DriverCard"));
const RideLayout_1 = __importDefault(require("@/components/ui/RideLayout"));
const driverUtils_1 = require("@/utils/functions/driverUtils");
const DriversPage = () => {
    const router = (0, navigation_1.useRouter)();
    const { drivers, selectedDriver, setSelectedDriver } = (0, store_1.useDriverStore)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [markerData, setMarkerData] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const markerDataPromises = drivers.map(async (driver) => {
                    if (!driver.busId)
                        return null;
                    const result = await (0, driverUtils_1.getDriverAndBusMarkerData)(driver.id);
                    return result.data || null;
                });
                const results = await Promise.all(markerDataPromises);
                const validMarkerData = results.filter((marker) => marker !== null);
                setMarkerData(validMarkerData);
                setIsLoading(false);
            }
            catch (error) {
                console.error('Error fetching marker data:', error);
                setIsLoading(false);
            }
        };
        fetchData();
    }, [drivers]);
    if (isLoading) {
        return (<RideLayout_1.default title="Choose a Driver">
                <p className="text-gray-500">Loading drivers...</p>
            </RideLayout_1.default>);
    }
    if (markerData.length === 0) {
        return (<RideLayout_1.default title="Choose a Driver">
                <p className="text-red-500">No drivers available at the moment.</p>
            </RideLayout_1.default>);
    }
    return (<RideLayout_1.default title="Choose a Driver">
            <div className="space-y-4">
                {markerData.map((marker) => (<DriverCard_1.default key={marker.id} item={marker} selected={selectedDriver ?? 0} setSelected={() => {
                setSelectedDriver(marker.id);
                router.push(`/drivers/${marker.id}`);
            }}/>))}
            </div>
        </RideLayout_1.default>);
};
exports.default = DriversPage;
