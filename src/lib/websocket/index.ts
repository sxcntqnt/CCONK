// src/lib/websocket/index.ts
import { WebSocketConnection } from './connection';
import { MessageHandler } from './message';

interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

class WebSocketManager {
    private static instance: WebSocketManager | null = null;
    private connection: WebSocketConnection;
    private messageHandler: MessageHandler;

    private constructor(config: WebSocketConfig) {
        this.connection = new WebSocketConnection(config);
        this.messageHandler = new MessageHandler(this.connection);
    }

    public static getInstance(config: WebSocketConfig): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager(config);
        }
        return WebSocketManager.instance;
    }

    public initialize(): void {
        this.connection.connect();
        // Subscribe to server responses
        this.messageHandler.subscribe('success', (message) => {
            console.log('WebSocket success:', message.payload);
        });
        this.messageHandler.subscribe('error', (message) => {
            console.error('WebSocket error:', message.payload);
        });
        this.messageHandler.subscribe('trip_update', (message) => {
            console.log('Trip update:', message.payload);
        });
        this.messageHandler.subscribe('reservation_update', (message) => {
            console.log('Reservation update:', message.payload);
        });
    }

    public sendStatusMessage(status: string, driverId: string, destination?: string): void {
        this.messageHandler.send({
            type: 'status_update',
            payload: { status, driverId, destination },
        });
    }

    public subscribeToTrip(tripId: string): void {
        this.messageHandler.send({
            type: 'subscribe_trip',
            payload: { tripId },
        });
    }

    public unsubscribeFromTrip(tripId: string): void {
        this.messageHandler.send({
            type: 'unsubscribe_trip',
            payload: { tripId },
        });
    }

    public subscribeToReservations(driverId: string): void {
        this.messageHandler.send({
            type: 'subscribe_reservations',
            payload: { driverId },
        });
    }

    public unsubscribeFromReservations(driverId: string): void {
        this.messageHandler.send({
            type: 'unsubscribe_reservations',
            payload: { driverId },
        });
    }

    public on(event: string, callback: (data: any) => void): void {
        this.messageHandler.subscribe(event, callback);
    }

    public getMessageHandler(): MessageHandler {
        return this.messageHandler;
    }

    public disconnect(): void {
        this.connection.disconnect();
    }
}

// Export the class as a value and the interface as a type
export { WebSocketManager };
export type { WebSocketConfig };
export default WebSocketManager;
