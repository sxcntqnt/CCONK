'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { WebSocketManager } from './index';

interface TripUpdate {
    tripId: number;
    status: string;
    timestamp: number;
}

function RealTimeTripUpdates({ tripId }: { tripId: number }) {
    const [tripStatus, setTripStatus] = useState<string>('Loading...');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Use environment variable for WebSocket URL
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:1738'; // Fallback to localhost if not set
        if (!wsUrl) {
            console.error('NEXT_PUBLIC_WEBSOCKET_URL is not defined in .env');
        }

        // First, ensure the server has a webhook set up for this trip
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
            } catch (error) {
                console.error('Error setting up webhook:', error);
                toast.error('Failed to set up trip updates');
            }
        };
        
        setupWebhook();

        // Now set up WebSocket connection
        const wsManager = WebSocketManager.getInstance({
            url: wsUrl,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
        });

        wsManager.initialize();
        const messageHandler = wsManager.getMessageHandler();
        const connection = messageHandler.getConnection();

        // Connection status listener
        const ws = connection.getWebSocket();
        const updateConnectionStatus = () => setIsConnected(connection.isConnected());

        if (ws) {
            ws.onopen = () => {
                updateConnectionStatus();
                messageHandler.send({
                    type: 'subscribe_trip',
                    payload: { tripId },
                });
            };
            ws.onclose = updateConnectionStatus;
            ws.onerror = updateConnectionStatus;
        }

        // Initial subscription request if already connected
        if (connection.isConnected()) {
            messageHandler.send({
                type: 'subscribe_trip',
                payload: { tripId },
            });
        }

        // Subscribe to updates
        const unsubscribe = messageHandler.subscribe('trip_update', (message) => {
            const update: TripUpdate = message.payload;
            if (update.tripId === tripId) {
                setTripStatus(update.status);
                if (update.status === 'completed') {
                    toast.success('Trip completed!');
                } else if (update.status === 'cancelled') {
                    toast.error('Trip cancelled');
                } else {
                    toast.info(`Trip status updated: ${update.status}`);
                }
            }
        });

        // Poll connection status
        const interval = setInterval(updateConnectionStatus, 1000);

        return () => {
            unsubscribe();
            messageHandler.send({
                type: 'unsubscribe_trip',
                payload: { tripId },
            });
            clearInterval(interval);
            wsManager.disconnect();
        };
    }, [tripId]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Real-Time Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
                <p>Current Trip Status: {tripStatus}</p>
            </CardContent>
        </Card>
    );
}

export default RealTimeTripUpdates;
