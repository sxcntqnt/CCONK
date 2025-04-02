// components/RTU.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { WebSocketManager } from '@lib/websocket/index';

// Define the trip update message type
interface TripUpdate {
  tripId: number;
  status: string;
  timestamp: number;
}

function RealTimeTripUpdates({ tripId }: { tripId: number }) {
  const [tripStatus, setTripStatus] = useState<string>('Loading...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const wsManager = WebSocketManager.getInstance({
      url: 'ws://localhost:8080', // Replace with your WebSocket server URL
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    });

    wsManager.initialize();
    const messageHandler = wsManager.getMessageHandler();

    // Monitor connection status
    const ws = messageHandler.getConnection().getWebSocket();
    if (ws) {
      ws.onopen = () => {
        setIsConnected(true);
        // Request initial trip status when connected
        messageHandler.send({
          type: 'subscribe_trip',
          payload: { tripId }
        });
      };
      ws.onclose = () => setIsConnected(false);
    }

    // Subscribe to trip updates
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

    // Cleanup
    return () => {
      unsubscribe();
      messageHandler.send({
        type: 'unsubscribe_trip',
        payload: { tripId }
      });
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
