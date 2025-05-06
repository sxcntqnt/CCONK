"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const card_1 = require("@/components/ui/card");
const sonner_1 = require("sonner");
const websocket_1 = require("@/lib/websocket");
const store_1 = require("@/store");
function RealTimeTripUpdates({ tripId, driverId }) {
    const [tripStatus, setTripStatus] = (0, react_1.useState)('Loading...');
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    const { setReservationCount } = (0, store_1.useReservationStore)();
    const { setActiveStatus } = (0, store_1.useDriverStore)();
    const { setSelectedTrip } = (0, store_1.useTripStore)();
    const handleTripUpdate = (0, react_1.useCallback)((update) => {
        if (update.tripId === tripId) {
            setTripStatus(update.status);
            setSelectedTrip(tripId);
            switch (update.status.toLowerCase()) {
                case 'completed':
                    sonner_1.toast.success('Trip completed!');
                    setActiveStatus('inactive');
                    break;
                case 'cancelled':
                    sonner_1.toast.error('Trip cancelled');
                    setActiveStatus('inactive');
                    break;
                default:
                    sonner_1.toast.info(`Trip status updated: ${update.status}`);
                    setActiveStatus('active');
            }
        }
    }, [tripId, setSelectedTrip, setActiveStatus]);
    const handleReservationUpdate = (0, react_1.useCallback)((update) => {
        if (update.driverId === driverId) {
            setReservationCount(update.reservationCount);
            sonner_1.toast.info(`Bus reservations updated: ${update.reservationCount} seats reserved`);
        }
    }, [driverId, setReservationCount]);
    const handleLocationUpdate = (0, react_1.useCallback)((update) => {
        if (update.driverId === driverId) {
            sonner_1.toast.info('Driver location updated');
            // Could update useLocationStore here if needed
        }
    }, [driverId]);
    (0, react_1.useEffect)(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738';
        if (!wsUrl) {
            console.error('NEXT_PUBLIC_WEBSOCKET_URL is not defined in .env');
            sonner_1.toast.error('WebSocket configuration error');
            return;
        }
        const setupWebhook = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1738';
                const response = await fetch(`${apiUrl}/api/setup-trip-webhook`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ tripId }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            catch (error) {
                console.error('Error setting up webhook:', error);
                sonner_1.toast.error('Failed to set up trip updates');
            }
        };
        setupWebhook();
        const wsManager = websocket_1.WebSocketManager.getInstance({
            url: wsUrl,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
        });
        wsManager.initialize();
        const messageHandler = wsManager.getMessageHandler();
        const connection = messageHandler.getConnection();
        const ws = connection.getWebSocket();
        const updateConnectionStatus = () => {
            setIsConnected(connection.isConnected());
            if (!connection.isConnected()) {
                sonner_1.toast.warning('WebSocket disconnected, attempting to reconnect...');
            }
        };
        if (ws) {
            ws.on('connect', () => {
                updateConnectionStatus();
                messageHandler.send({
                    type: 'subscribe_trip',
                    payload: { tripId },
                });
                messageHandler.send({
                    type: 'subscribe_reservations',
                    payload: { driverId },
                });
                messageHandler.send({
                    type: 'subscribe_location',
                    payload: { driverId },
                });
            });
            ws.on('disconnect', () => {
                updateConnectionStatus();
                sonner_1.toast.warning('WebSocket connection lost');
            });
            ws.on('connect_error', (error) => {
                updateConnectionStatus();
                console.error('WebSocket connection error:', error);
                sonner_1.toast.error('Failed to connect to real-time updates');
            });
        }
        // Subscribe to updates
        const unsubscribeTrip = messageHandler.subscribe('trip_update', (message) => {
            handleTripUpdate(message.payload);
        });
        const unsubscribeReservations = messageHandler.subscribe('reservation_update', (message) => {
            handleReservationUpdate(message.payload);
        });
        const unsubscribeLocation = messageHandler.subscribe('location_update', (message) => {
            handleLocationUpdate(message.payload);
        });
        // Periodic connection status check
        const interval = setInterval(updateConnectionStatus, 1000);
        // Cleanup
        return () => {
            unsubscribeTrip();
            unsubscribeReservations();
            unsubscribeLocation();
            messageHandler.send({
                type: 'unsubscribe_trip',
                payload: { tripId },
            });
            messageHandler.send({
                type: 'unsubscribe_reservations',
                payload: { driverId },
            });
            messageHandler.send({
                type: 'unsubscribe_location',
                payload: { driverId },
            });
            clearInterval(interval);
            wsManager.disconnect();
        };
    }, [tripId, driverId, handleTripUpdate, handleReservationUpdate, handleLocationUpdate]);
    return (<card_1.Card className="w-full">
            <card_1.CardHeader>
                <card_1.CardTitle>Real-Time Updates</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
                <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
                <p>Current Trip Status: {tripStatus}</p>
            </card_1.CardContent>
        </card_1.Card>);
}
exports.default = RealTimeTripUpdates;
