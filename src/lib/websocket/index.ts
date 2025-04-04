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
export type { WebSocketConfig }; // Use 'export type' for the interface
export default WebSocketManager;
