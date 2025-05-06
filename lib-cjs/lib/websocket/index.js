"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
// src/lib/websocket/index.ts
const connection_1 = require("./connection");
const message_1 = require("./message");
class WebSocketManager {
    static instance = null;
    connection;
    messageHandler;
    constructor(config) {
        this.connection = new connection_1.WebSocketConnection(config);
        this.messageHandler = new message_1.MessageHandler(this.connection);
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
            payload: { status, driverId, destination }
        });
    }
    subscribeToTrip(tripId) {
        this.messageHandler.send({
            type: 'subscribe_trip',
            payload: { tripId }
        });
    }
    unsubscribeFromTrip(tripId) {
        this.messageHandler.send({
            type: 'unsubscribe_trip',
            payload: { tripId }
        });
    }
    subscribeToReservations(driverId) {
        this.messageHandler.send({
            type: 'subscribe_reservations',
            payload: { driverId }
        });
    }
    unsubscribeFromReservations(driverId) {
        this.messageHandler.send({
            type: 'unsubscribe_reservations',
            payload: { driverId }
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
exports.WebSocketManager = WebSocketManager;
exports.default = WebSocketManager;
