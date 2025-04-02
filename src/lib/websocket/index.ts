import { WebSocketConnection } from './connection';
import { MessageHandler } from './message';

// Configuration interface
interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

// Singleton class to manage WebSocket instance
class WebSocketManager {
    private static instance: WebSocketManager;
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

    // Initialize WebSocket connection
    public initialize(): void {
        this.connection.connect();
    }

    // Get message handler instance
    public getMessageHandler(): MessageHandler {
        return this.messageHandler;
    }

    // Cleanup
    public disconnect(): void {
        this.connection.disconnect();
    }
}

// Export the manager and types
export { WebSocketManager, WebSocketConfig };
export default WebSocketManager;
