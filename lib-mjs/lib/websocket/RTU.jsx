'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { WebSocketManager } from '@/lib/websocket';
import { useDriverStore, useTripStore, useReservationStore } from '@/store';
function RealTimeTripUpdates({ tripId, driverId }) {
    const [tripStatus, setTripStatus] = useState('Loading...');
    const [isConnected, setIsConnected] = useState(false);
    const { setReservationCount } = useReservationStore();
    const { setActiveStatus } = useDriverStore();
    const { setSelectedTrip } = useTripStore();
    const handleTripUpdate = useCallback((update) => {
        if (update.tripId === tripId) {
            setTripStatus(update.status);
            setSelectedTrip(tripId);
            switch (update.status.toLowerCase()) {
                case 'completed':
                    toast.success('Trip completed!');
                    setActiveStatus('inactive');
                    break;
                case 'cancelled':
                    toast.error('Trip cancelled');
                    setActiveStatus('inactive');
                    break;
                default:
                    toast.info(`Trip status updated: ${update.status}`);
                    setActiveStatus('active');
            }
        }
    }, [tripId, setSelectedTrip, setActiveStatus]);
    const handleReservationUpdate = useCallback((update) => {
        if (update.driverId === driverId) {
            setReservationCount(update.reservationCount);
            toast.info(`Bus reservations updated: ${update.reservationCount} seats reserved`);
        }
    }, [driverId, setReservationCount]);
    const handleLocationUpdate = useCallback((update) => {
        if (update.driverId === driverId) {
            toast.info('Driver location updated');
            // Could update useLocationStore here if needed
        }
    }, [driverId]);
    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738';
        if (!wsUrl) {
            console.error('NEXT_PUBLIC_WEBSOCKET_URL is not defined in .env');
            toast.error('WebSocket configuration error');
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
                toast.error('Failed to set up trip updates');
            }
        };
        setupWebhook();
        const wsManager = WebSocketManager.getInstance({
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
                toast.warning('WebSocket disconnected, attempting to reconnect...');
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
                toast.warning('WebSocket connection lost');
            });
            ws.on('connect_error', (error) => {
                updateConnectionStatus();
                console.error('WebSocket connection error:', error);
                toast.error('Failed to connect to real-time updates');
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
    return (<Card className="w-full">
            <CardHeader>
                <CardTitle>Real-Time Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
                <p>Current Trip Status: {tripStatus}</p>
            </CardContent>
        </Card>);
}
export default RealTimeTripUpdates;
