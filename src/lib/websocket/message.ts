import { WebSocketConnection } from './connection';

// Message types
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
        this.setupMessageListener();
    }

    private setupMessageListener(): void {
        const ws = this.connection.getWebSocket();
        if (ws) {
            ws.onmessage = (event) => {
                try {
                    const message: Message = JSON.parse(event.data);
                    this.dispatchMessage(message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };
        }
    }

    // Subscribe to specific message types
    public subscribe(messageType: string, callback: MessageCallback): () => void {
        if (!this.subscribers.has(messageType)) {
            this.subscribers.set(messageType, new Set());
        }
        this.subscribers.get(messageType)?.add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.get(messageType)?.delete(callback);
            if (this.subscribers.get(messageType)?.size === 0) {
                this.subscribers.delete(messageType);
            }
        };
    }

    // Send message to WebSocket server
    public send(message: Message): void {
        if (this.connection.isConnected()) {
            const ws = this.connection.getWebSocket();
            ws?.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message: WebSocket not connected');
        }
    }

    // Dispatch received messages to subscribers
    private dispatchMessage(message: Message): void {
        const subscribers = this.subscribers.get(message.type);
        if (subscribers) {
            subscribers.forEach((callback) => callback(message));
        }
    }
}
