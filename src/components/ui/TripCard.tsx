import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import MaplibreDraw from 'maplibre-gl-draw';
import { useUser } from '@clerk/nextjs';
import { aeonik } from '@/utils/constants/fonts';
import { icons } from '@/utils/constants/icons';
import { Trip } from '@/utils/constants/types';
import { MapComponent } from './MapComponent';

const TripCard = ({ trip }: { trip: Trip }) => {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const drawRef = useRef<MaplibreDraw | null>(null);
    const [driverName, setDriverName] = useState<string>('Unassigned');
    const { user } = useUser();

    // Fetch driver details from Clerk if driverId exists
    useEffect(() => {
        const fetchDriverDetails = async () => {
            if (!trip.driverId) {
                setDriverName('Unassigned');
                return;
            }

            try {
                // Assuming driverId corresponds to a Clerk user ID
                const response = await fetch(`/api/clerk/user/${trip.driverId}`);
                if (response.ok) {
                    const driver = await response.json();
                    setDriverName(`${driver.firstName} ${driver.lastName}`);
                } else {
                    setDriverName('Unknown Driver');
                }
            } catch (error) {
                console.error('Failed to fetch driver details:', error);
                setDriverName('Unknown Driver');
            }
        };

        fetchDriverDetails();
    }, [trip.driverId]);

    // Event handlers for MapComponent
    const handleMapLoad = () => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Use explicit coordinates from Trip interface
        const departureCoords: [number, number] = [trip.originLongitude ?? 0, trip.originLatitude ?? 0];
        const arrivalCoords: [number, number] = [trip.destinationLongitude ?? 0, trip.destinationLatitude ?? 0];

        // Add marker for departure if coordinates are available
        if (trip.originLatitude && trip.originLongitude) {
            new maplibregl.Marker({ color: '#FF0000' })
                .setLngLat(departureCoords)
                .setPopup(new maplibregl.Popup().setText(`Departure: ${trip.departureCity}`))
                .addTo(map);
        }

        // Add marker for arrival if coordinates are available
        if (trip.destinationLatitude && trip.destinationLongitude) {
            new maplibregl.Marker({ color: '#00FF00' })
                .setLngLat(arrivalCoords)
                .setPopup(new maplibregl.Popup().setText(`Arrival: ${trip.arrivalCity}`))
                .addTo(map);
        }

        // Add route as a straight-line polyline if both coordinates are available
        if (trip.originLatitude && trip.originLongitude && trip.destinationLatitude && trip.destinationLongitude) {
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [departureCoords, arrivalCoords],
                    },
                },
            });

            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#888',
                    'line-width': 4,
                    'line-dasharray': [2, 2],
                },
            });
        }

        // Fit map to include both markers if coordinates are available
        if (trip.originLatitude && trip.originLongitude && trip.destinationLatitude && trip.destinationLongitude) {
            const bounds = new maplibregl.LngLatBounds();
            bounds.extend(departureCoords);
            bounds.extend(arrivalCoords);
            map.fitBounds(bounds, {
                padding: { top: 20, bottom: 20, left: 20, right: 20 },
                maxZoom: 15,
            });
        } else if (trip.originLatitude && trip.originLongitude) {
            // Center on departure if only departure coords are available
            map.setCenter(departureCoords);
            map.setZoom(13);
        } else if (trip.destinationLatitude && trip.destinationLongitude) {
            // Center on arrival if only arrival coords are available
            map.setCenter(arrivalCoords);
            map.setZoom(13);
        }
    };

    const handleDrawCreate = (e: any) => {
        // No-op; geofence drawing not used in TripCard
    };
    const handleDrawUpdate = (e: any) => {
        // No-op; geofence drawing not used in TripCard
    };
    const handleDrawDelete = (e: any) => {
        // No-op; geofence drawing not used in TripCard
    };

    return (
        <div
            className={`flex flex-row items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-4 ${aeonik.variable}`}
        >
            <div className="flex flex-col items-start justify-center w-full">
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="w-20 h-[90px] rounded-lg overflow-hidden">
                        <MapComponent
                            onMapLoad={handleMapLoad}
                            onDrawCreate={handleDrawCreate}
                            onDrawUpdate={handleDrawUpdate}
                            onDrawDelete={handleDrawDelete}
                            mapRef={mapRef}
                            drawRef={drawRef}
                        />
                    </div>

                    <div className="flex flex-col mx-4 gap-y-4 flex-1">
                        <div className="flex flex-row items-center gap-x-2">
                            <Image src={icons.to} alt="Origin icon" width={20} height={20} className="w-5 h-5" />
                            <span className="text-base font-aeonik-medium truncate">{trip.departureCity}</span>
                        </div>

                        <div className="flex flex-row items-center gap-x-2">
                            <Image
                                src={icons.point}
                                alt="Destination icon"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                            />
                            <span className="text-base font-aeonik-medium truncate">{trip.arrivalCity}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col w-full mt-4 bg-gray-100 rounded-lg p-4">
                    <div className="flex flex-row items-center justify-between mb-4">
                        <span className="text-base font-aeonik-medium text-gray-500">Date & Time</span>
                        <span className="text-base font-aeonik-bold truncate">
                            {new Date(trip.departureTime).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex flex-row items-center justify-between mb-4">
                        <span className="text-base font-aeonik-medium text-gray-500">Driver</span>
                        <span className="text-base font-aeonik-bold">{driverName}</span>
                    </div>

                    <div className="flex flex-row items-center justify-between mb-4">
                        <span className="text-base font-aeonik-medium text-gray-500">Status</span>
                        <span
                            className={`text-base font-aeonik-bold capitalize ${
                                trip.status === 'completed' ? 'text-green-500' : 'text-blue-500'
                            }`}
                        >
                            {trip.status}
                        </span>
                    </div>

                    <div className="flex flex-row items-center justify-between">
                        <span className="text-base font-aeonik-medium text-gray-500">Fully Booked</span>
                        <span
                            className={`text-base font-aeonik-bold ${
                                trip.isFullyBooked ? 'text-red-500' : 'text-green-500'
                            }`}
                        >
                            {trip.isFullyBooked ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripCard;
