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
    const { setReservationCount } = (0, store_1.useDriverStore)();
    (0, react_1.useEffect)(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738';
        if (!wsUrl) {
            console.error('NEXT_PUBLIC_WEBSOCKET_URL is not defined in .env');
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
                    throw new Error('Failed to set up trip webhook');
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
        const updateConnectionStatus = () => setIsConnected(connection.isConnected());
        if (ws) {
            ws.onopen = () => {
                updateConnectionStatus();
                messageHandler.send({
                    type: 'subscribe_trip',
                    payload: { tripId },
                });
                messageHandler.send({
                    type: 'subscribe_reservations',
                    payload: { driverId },
                });
            };
            ws.onclose = updateConnectionStatus;
            ws.onerror = updateConnectionStatus;
        }
        if (connection.isConnected()) {
            messageHandler.send({
                type: 'subscribe_trip',
                payload: { tripId },
            });
            messageHandler.send({
                type: 'subscribe_reservations',
                payload: { driverId },
            });
        }
        const unsubscribeTrip = messageHandler.subscribe('trip_update', (message) => {
            const update = message.payload;
            if (update.tripId === tripId) {
                setTripStatus(update.status);
                if (update.status === 'completed') {
                    sonner_1.toast.success('Trip completed!');
                }
                else if (update.status === 'cancelled') {
                    sonner_1.toast.error('Trip cancelled');
                }
                else {
                    sonner_1.toast.info(`Trip status updated: ${update.status}`);
                }
            }
        });
        const unsubscribeReservations = messageHandler.subscribe('reservation_update', (message) => {
            const update = message.payload;
            if (update.driverId === driverId) {
                setReservationCount(update.reservationCount);
                sonner_1.toast.info(`Bus reservations updated: ${update.reservationCount} seats reserved`);
            }
        });
        const interval = setInterval(updateConnectionStatus, 1000);
        return () => {
            unsubscribeTrip();
            unsubscribeReservations();
            messageHandler.send({
                type: 'unsubscribe_trip',
                payload: { tripId },
            });
            messageHandler.send({
                type: 'unsubscribe_reservations',
                payload: { driverId },
            });
            clearInterval(interval);
            wsManager.disconnect();
        };
    }, [tripId, driverId, setReservationCount]);
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
