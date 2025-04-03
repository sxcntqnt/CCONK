// src/lib/server/wsserver.mjs
import { createServer } from 'http';
import { Server } from 'socket.io';
import { URL } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '../../.env' });

const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:1738'; // Match client
let port;
try {
    port = new URL(wsUrl).port || '1738'; // Default to 8080 if no port specified
} catch (error) {
    console.error('Invalid WEBSOCKET_URL:', error);
    process.exit(1);
}

const server = createServer();
const io = new Server(server, { cors: { origin: '*' } });

const tripSubscriptions = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'subscribe_trip':
                    const tripId = message.payload.tripId;
                    if (!tripSubscriptions.has(tripId)) {
                        tripSubscriptions.set(tripId, new Set());
                    }
                    tripSubscriptions.get(tripId).add(socket);
                    socket.emit('trip_update', {
                        type: 'trip_update',
                        payload: { tripId, status: 'scheduled', timestamp: Date.now() },
                    });
                    break;
                case 'unsubscribe_trip':
                    const unsubscribeTripId = message.payload.tripId;
                    if (tripSubscriptions.has(unsubscribeTripId)) {
                        tripSubscriptions.get(unsubscribeTripId).delete(socket);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    socket.on('disconnect', () => {
        for (const [tripId, clients] of tripSubscriptions) {
            clients.delete(socket);
            if (clients.size === 0) {
                tripSubscriptions.delete(tripId);
            }
        }
        console.log('Client disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
    });
});

setInterval(() => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    for (const [tripId, clients] of tripSubscriptions) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const update = { type: 'trip_update', payload: { tripId, status, timestamp: Date.now() } };
        clients.forEach((client) => {
            if (client.connected) {
                client.emit('trip_update', update);
            }
        });
    }
}, 5000);

server.listen(port, () => {
    console.log(`Socket.IO server running on ${wsUrl}`);
});
