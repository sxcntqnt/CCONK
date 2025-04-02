export * from './prisma';
export * from './names';

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const tripSubscriptions = new Map(); // Map<tripId, Set<ws>>

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        switch (message.type) {
            case 'subscribe_trip':
                const tripId = message.payload.tripId;
                if (!tripSubscriptions.has(tripId)) {
                    tripSubscriptions.set(tripId, new Set());
                }
                tripSubscriptions.get(tripId).add(ws);
                // Send initial status (could fetch from database)
                ws.send(
                    JSON.stringify({
                        type: 'trip_update',
                        payload: {
                            tripId,
                            status: 'scheduled', // Initial status
                            timestamp: Date.now(),
                        },
                    }),
                );
                break;

            case 'unsubscribe_trip':
                if (tripSubscriptions.has(message.payload.tripId)) {
                    tripSubscriptions.get(message.payload.tripId).delete(ws);
                }
                break;
        }
    });

    ws.on('close', () => {
        for (const [tripId, clients] of tripSubscriptions) {
            clients.delete(ws);
            if (clients.size === 0) {
                tripSubscriptions.delete(tripId);
            }
        }
    });
});

// Simulate trip updates (replace with real data source)
setInterval(() => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    for (const [tripId, clients] of tripSubscriptions) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const update = {
            type: 'trip_update',
            payload: {
                tripId,
                status,
                timestamp: Date.now(),
            },
        };
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(update));
            }
        });
    }
}, 5000);

console.log('WebSocket server running on ws://localhost:8080');
