import { WebSocketConnection } from './connection';
import { Socket } from 'socket.io-client';

interface Message {
    type: string;
    payload: any;
}

type MessageCallback = (message: Message) => void;

export class MessageHandler {
    private connection: WebSocketConnection;
    private subscribers: Map<string, Set<MessageCallback>> = new Map();

    constructor(connection: WebSocketConnection) {
        this.connection = connection;
    }

    private ensureMessageListener(): void {
        const socket = this.connection.getWebSocket() as Socket | null;
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
                    } catch (error) {
                        console.error('Failed to parse custom message:', error);
                    }
                }
            });
        }
    }

    public subscribe(messageType: string, callback: MessageCallback): () => void {
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

    public send(message: Message): void {
        this.ensureMessageListener();
        if (this.connection.isConnected()) {
            const socket = this.connection.getWebSocket() as Socket | null;
            socket?.emit(message.type, message.payload);
        } else {
            console.warn('Cannot send message: Socket.IO not connected');
        }
    }

    private dispatchMessage(message: Message): void {
        const subscribers = this.subscribers.get(message.type);
        if (subscribers) {
            subscribers.forEach((callback) => callback(message));
        }
        // Log for debugging
        if (message.type === 'success') {
            console.log(`Server confirmed ${message.payload.status} status update`);
        } else if (message.type === 'error') {
            console.error(`Server error: ${message.payload.error}`);
        } else if (message.type === 'trip_update') {
            console.log('Received trip update:', message.payload);
        }
    }

    public getConnection(): WebSocketConnection {
        return this.connection;
    }
}
