export class MessageHandler {
    connection;
    subscribers = new Map();
    constructor(connection) {
        this.connection = connection;
    }
    ensureMessageListener() {
        const socket = this.connection.getWebSocket();
        if (socket) {
            // Handle standard Socket.IO events
            socket.on('success', (data) => {
                this.dispatchMessage({ type: 'success', payload: data });
            });
            socket.on('error', (data) => {
                this.dispatchMessage({ type: 'error', payload: data });
            });
            socket.on('trip_update', (data) => {
                this.dispatchMessage({ type: 'trip_update', payload: data.payload });
            });
            // Handle custom message types
            socket.onAny((event, data) => {
                if (!['success', 'error', 'trip_update'].includes(event)) {
                    try {
                        this.dispatchMessage({ type: event, payload: data });
                    }
                    catch (error) {
                        console.error('Failed to parse custom message:', error);
                    }
                }
            });
        }
    }
    subscribe(messageType, callback) {
        this.ensureMessageListener();
        if (!this.subscribers.has(messageType)) {
            this.subscribers.set(messageType, new Set());
        }
        this.subscribers.get(messageType)?.add(callback);
        return () => {
            this.subscribers.get(messageType)?.delete(callback);
            if (this.subscribers.get(messageType)?.size === 0) {
                this.subscribers.delete(messageType);
            }
        };
    }
    send(message) {
        this.ensureMessageListener();
        if (this.connection.isConnected()) {
            const socket = this.connection.getWebSocket();
            socket?.emit(message.type, message.payload);
        }
        else {
            console.warn('Cannot send message: Socket.IO not connected');
        }
    }
    dispatchMessage(message) {
        const subscribers = this.subscribers.get(message.type);
        if (subscribers) {
            subscribers.forEach((callback) => callback(message));
        }
        // Log for debugging
        if (message.type === 'success') {
            console.log(`Server confirmed ${message.payload.status} status update`);
        }
        else if (message.type === 'error') {
            console.error(`Server error: ${message.payload.error}`);
        }
        else if (message.type === 'trip_update') {
            console.log('Received trip update:', message.payload);
        }
    }
    getConnection() {
        return this.connection;
    }
}
