"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("next/navigation");
const image_1 = __importDefault(require("next/image"));
const react_1 = require("react");
const fonts_1 = require("@/utils/constants/fonts");
const icons_1 = require("@/utils/constants/icons");
const MapComponent_1 = require("./MapComponent");
const RideLayout = ({ title, children, }) => {
    const router = (0, navigation_1.useRouter)();
    const mapRef = (0, react_1.useRef)(null);
    const drawRef = (0, react_1.useRef)(null);
    // Event handlers for MapComponent
    const handleMapLoad = () => {
        if (!mapRef.current)
            return;
        const map = mapRef.current;
        // Center map on a default location or trip data
        // Assuming Trip has startLat, startLng; adjust based on actual Trip type
        const tripCenter = [-1.36876, 36.33421]; // Default (replace with trip.startLng, trip.startLat if available)
        map.setCenter(tripCenter);
        map.setZoom(13);
        // Example: Add marker for trip start point (extend with actual trip data)
        // new maplibregl.Marker()
        //   .setLngLat([trip.startLng, trip.startLat])
        //   .addTo(map);
        // Add end point marker or route if needed
    };
    const handleDrawCreate = (e) => {
        // No-op; geofence drawing not used in trip details
    };
    const handleDrawUpdate = (e) => {
        // No-op; geofence drawing not used in trip details
    };
    const handleDrawDelete = (e) => {
        // No-op; geofence drawing not used in trip details
    };
    return (<div className={`flex flex-col min-h-screen bg-gray-50 ${fonts_1.aeonik.variable}`}>
      <div className="relative flex flex-col bg-blue-500">
        <div className="flex flex-row items-center justify-start px-5 py-4 absolute z-10 top-12">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center" aria-label="Go back">
            <image_1.default src={icons_1.icons.backArrow} alt="Back arrow" width={24} height={24} className="w-6 h-6"/>
          </button>
          <span className="text-xl font-aeonik-semibold ml-4 text-white">
            {title || 'Go Back'}
          </span>
        </div>
        <MapComponent_1.MapComponent onMapLoad={handleMapLoad} onDrawCreate={handleDrawCreate} onDrawUpdate={handleDrawUpdate} onDrawDelete={handleDrawDelete} mapRef={mapRef} drawRef={drawRef}/>
      </div>

      <div className="flex-1 max-w-4xl mx-auto p-6 bg-white rounded-t-2xl shadow-md mt-[-20px] z-20">
        {children}
      </div>
    </div>);
};
exports.default = RideLayout;
