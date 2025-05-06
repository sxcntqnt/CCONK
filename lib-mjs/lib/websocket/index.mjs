// src/lib/websocket/index.ts
import { WebSocketConnection } from './connection.mjs';
import { MessageHandler } from './message.mjs';
class WebSocketManager {
    static instance = null;
    connection;
    messageHandler;
    constructor(config) {
        this.connection = new WebSocketConnection(config);
        this.messageHandler = new MessageHandler(this.connection);
    }
    static getInstance(config) {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager(config);
        }
        return WebSocketManager.instance;
    }
    initialize() {
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
    sendStatusMessage(status, driverId, destination) {
        this.messageHandler.send({
            type: 'status_update',
            payload: { status, driverId, destination },
        });
    }
    subscribeToTrip(tripId) {
        this.messageHandler.send({
            type: 'subscribe_trip',
            payload: { tripId },
        });
    }
    unsubscribeFromTrip(tripId) {
        this.messageHandler.send({
            type: 'unsubscribe_trip',
            payload: { tripId },
        });
    }
    subscribeToReservations(driverId) {
        this.messageHandler.send({
            type: 'subscribe_reservations',
            payload: { driverId },
        });
    }
    unsubscribeFromReservations(driverId) {
        this.messageHandler.send({
            type: 'unsubscribe_reservations',
            payload: { driverId },
        });
    }
    on(event, callback) {
        this.messageHandler.subscribe(event, callback);
    }
    getMessageHandler() {
        return this.messageHandler;
    }
    disconnect() {
        this.connection.disconnect();
    }
}
// Export the class as a value and the interface as a type
export { WebSocketManager };
export default WebSocketManager;
