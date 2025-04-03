// message.ts
import { WebSocketConnection } from './connection';

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
        const ws = this.connection.getWebSocket();
        if (ws && !ws.onmessage) {
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
            const ws = this.connection.getWebSocket();
            ws?.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message: WebSocket not connected');
        }
    }

    private dispatchMessage(message: Message): void {
        const subscribers = this.subscribers.get(message.type);
        if (subscribers) {
            subscribers.forEach((callback) => callback(message));
        }
    }

    public getConnection(): WebSocketConnection {
        return this.connection;
    }
}
