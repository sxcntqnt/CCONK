// connection.ts
export class WebSocketConnection {
    private ws: WebSocket | null = null;
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
        if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
            return; // Prevent multiple connections
        }

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.ws = null;
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.ws?.close(); // Ensure cleanup on error
            };

            // onmessage will be set by MessageHandler
        } catch (error) {
            console.error('Failed to establish WebSocket connection:', error);
            this.handleReconnect();
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    public getWebSocket(): WebSocket | null {
        return this.ws;
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
