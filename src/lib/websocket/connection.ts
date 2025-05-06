import { io, Socket } from 'socket.io-client';

export class WebSocketConnection {
    private socket: Socket | null = null;
    private url: string;
    private reconnectInterval: number;
    private maxReconnectAttempts: number;
    private reconnectAttempts: number = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor(config: { url: string; reconnectInterval?: number; maxReconnectAttempts?: number }) {
        this.url = config.url;
        this.reconnectInterval = config.reconnectInterval || 5000;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    }

    public connect(): void {
        if (this.socket && this.socket.connected) {
            return; // Prevent multiple connections
        }

        try {
            this.socket = io(this.url, {
                transports: ['websocket'],
                reconnection: false, // We'll handle reconnection manually
            });

            this.socket.on('connect', () => {
                console.log('Socket.IO connection established');
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO connection closed');
                this.socket = null;
                this.handleReconnect();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
                this.socket?.disconnect();
                this.handleReconnect();
            });

            // Message handling will be set by MessageHandler
        } catch (error) {
            console.error('Failed to establish Socket.IO connection:', error);
            this.handleReconnect();
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    public getWebSocket(): Socket | null {
        return this.socket;
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.reconnectTimeout = setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
            console.error('Maximum reconnection attempts reached');
        }
    }
}
