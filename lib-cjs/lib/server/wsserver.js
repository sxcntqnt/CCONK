"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const svix_1 = require("svix");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const index_1 = require("@/utils/index");
// Load environment variables
dotenv_1.default.config({ path: './.env' });
// Initialize Express app
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(body_parser_1.default.json());
// Create HTTP server
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
    transports: ['websocket'],
});
// Initialize Prisma client
const db = new client_1.PrismaClient();
// Get Svix API key from environment variables
const svixApiKey = process.env.SVIX_API_KEY;
if (!svixApiKey) {
    console.error('SVIX_API_KEY is not set');
    process.exit(1);
}
// Initialize Svix client
const svix = new svix_1.Svix(svixApiKey);
// Store for active app-endpoint relationships and webhooks
const tripSubscriptions = new Map();
const webhookSecret = process.env.WEBHOOK_SECRET || 'your_webhook_secret';
// WebSocket connections by tripId
const wsClients = new Map();
// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('subscribe_trip', async (data) => {
        try {
            const { tripId } = data;
            if (!tripId || isNaN(Number(tripId))) {
                socket.emit('error', { error: 'Invalid or missing tripId' });
                return;
            }
            // Verify trip exists
            const trip = await db.trip.findUnique({
                where: { id: Number(tripId) },
                select: { status: true },
            });
            if (!trip) {
                socket.emit('error', { error: 'Trip not found' });
                return;
            }
            // Add client to trip's subscribers
            if (!wsClients.has(tripId)) {
                wsClients.set(tripId, new Set());
            }
            wsClients.get(tripId).add(socket);
            console.log(`Client subscribed to trip ${tripId}`);
            // Send initial status
            const lastStatus = tripSubscriptions.get(tripId)?.lastStatus || trip.status || 'scheduled';
            socket.emit('trip_update', {
                type: 'trip_update',
                payload: { tripId, status: lastStatus, timestamp: Date.now() },
            });
        }
        catch (error) {
            console.error('Error processing subscribe message:', error);
            socket.emit('error', { error: 'Failed to subscribe to trip' });
        }
    });
    socket.on('unsubscribe_trip', (data) => {
        try {
            const { tripId } = data;
            if (!tripId || isNaN(Number(tripId))) {
                socket.emit('error', { error: 'Invalid or missing tripId' });
                return;
            }
            // Remove client from trip's subscribers
            if (wsClients.has(tripId)) {
                wsClients.get(tripId).delete(socket);
                if (wsClients.get(tripId).size === 0) {
                    wsClients.delete(tripId);
                }
            }
            console.log(`Client unsubscribed from trip ${tripId}`);
        }
        catch (error) {
            console.error('Error processing unsubscribe message:', error);
            socket.emit('error', { error: 'Failed to unsubscribe from trip' });
        }
    });
    socket.on('status_update', async (data) => {
        try {
            const { status, driverId, destination } = data;
            if (!status || !driverId || isNaN(Number(driverId))) {
                socket.emit('error', { error: 'Invalid message: status and driverId required' });
                return;
            }
            // Validate driver
            const driverResponse = await (0, index_1.getDriverById)(Number(driverId));
            if (driverResponse.error || !driverResponse.data) {
                socket.emit('error', { error: 'Driver not found' });
                return;
            }
            // Map client status to server status
            const statusMap = {
                'in-transit': 'in_progress',
                'arrived': 'completed',
            };
            const serverStatus = statusMap[status] || status;
            const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(serverStatus) && serverStatus !== 'offline') {
                socket.emit('error', { error: `Invalid status: ${status}` });
                return;
            }
            let tripId = null;
            if (serverStatus === 'offline') {
                // Update driver status to offline
                await db.driver.update({
                    where: { id: Number(driverId) },
                    data: { status: 'offline' },
                });
                console.log(`Driver ${driverId} set to offline`);
            }
            else {
                // Get active trip for driver
                const tripResponse = await (0, index_1.getTripIdForDriver)(Number(driverId));
                if (tripResponse.error || !tripResponse.data) {
                    socket.emit('error', { error: 'No active trip found for driver' });
                    return;
                }
                tripId = tripResponse.data.toString();
                // Update trip status and send notifications
                const updateResponse = await (0, index_1.updateTripStatus)(Number(tripId), serverStatus, Number(driverId), `Driver with ID ${driverId} is now ${serverStatus}.`, serverStatus === 'completed' ? destination : undefined);
                if (updateResponse.error) {
                    socket.emit('error', { error: updateResponse.error });
                    return;
                }
            }
            // Broadcast status update via Svix if tripId is available
            if (tripId && tripSubscriptions.has(tripId)) {
                const subscription = tripSubscriptions.get(tripId);
                subscription.lastStatus = serverStatus;
                await svix.message.create(subscription.appId, {
                    eventType: 'trip_update',
                    payload: {
                        tripId,
                        status: serverStatus,
                        driverId,
                        destination: serverStatus === 'completed' ? destination : undefined,
                        timestamp: Date.now(),
                    },
                });
                console.log(`Broadcasted ${serverStatus} update for trip ${tripId}`);
            }
            socket.emit('success', { status: serverStatus, driverId, destination });
        }
        catch (error) {
            console.error('Error processing status_update:', error);
            socket.emit('error', { error: 'Failed to process status update' });
        }
    });
    socket.on('disconnect', () => {
        // Remove socket from all trip subscriptions
        for (const [tripId, clients] of wsClients.entries()) {
            clients.delete(socket);
            if (clients.size === 0) {
                wsClients.delete(tripId);
            }
        }
        console.log('Client disconnected');
    });
});
// Create or get a Svix application for a trip
async function getOrCreateAppForTrip(tripId) {
    try {
        const appName = `trip-${tripId}`;
        // Try to find an existing app
        try {
            return await svix.application.get(appName);
        }
        catch (err) {
            // If not found, create a new app
            return await svix.application.create({
                name: appName,
                uid: appName,
            });
        }
    }
    catch (error) {
        console.error(`Error managing Svix app for trip ${tripId}:`, error);
        throw error;
    }
}
// Endpoint to create Svix webhook endpoint for a trip
app.post('/api/setup-trip-webhook', async (req, res) => {
    try {
        const { tripId } = req.body;
        if (!tripId || isNaN(Number(tripId))) {
            return res.status(400).json({ error: 'Invalid or missing tripId' });
        }
        // Verify trip exists
        const trip = await db.trip.findUnique({
            where: { id: Number(tripId) },
        });
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        // Get or create app for this trip
        const app = await getOrCreateAppForTrip(tripId);
        // Get the webhook URL for our server
        const webhookUrl = `${process.env.SERVER_URL || 'http://localhost:1738'}/api/webhooks/trip-updates`;
        // Create endpoint for our server
        const endpoint = await svix.endpoint.create(app.id, {
            url: webhookUrl,
            description: `Endpoint for trip ${tripId} updates`,
            version: 1,
        });
        // Store subscription info
        tripSubscriptions.set(tripId, {
            appId: app.id,
            endpointId: endpoint.id,
            lastStatus: trip.status || 'scheduled',
        });
        // Send initial status
        await svix.message.create(app.id, {
            eventType: 'trip_update',
            payload: {
                tripId,
                status: trip.status || 'scheduled',
                timestamp: Date.now(),
            },
        });
        res.status(200).json({
            success: true,
            message: 'Webhook endpoint created for trip updates',
            tripId,
        });
    }
    catch (error) {
        console.error('Error setting up trip webhook:', error);
        res.status(500).json({ error: 'Failed to set up trip webhook' });
    }
});
// Webhook endpoint to receive trip updates from Svix
app.post('/api/webhooks/trip-updates', async (req, res) => {
    try {
        const svixId = req.headers['svix-id'];
        const svixTimestamp = req.headers['svix-timestamp'];
        const svixSignature = req.headers['svix-signature'];
        if (!svixId || !svixTimestamp || !svixSignature) {
            return res.status(400).json({ error: 'Missing Svix headers' });
        }
        // Verify the webhook signature
        const webhook = svix.webhook(webhookSecret);
        let event;
        try {
            event = webhook.verify(JSON.stringify(req.body), {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        }
        catch (error) {
            console.error('Invalid webhook signature:', error);
            return res.status(400).json({ error: 'Invalid signature' });
        }
        // Process the webhook event
        if (event.eventType === 'trip_update') {
            const tripId = event.payload.tripId;
            const status = event.payload.status;
            // Store the latest status
            if (tripSubscriptions.has(tripId)) {
                tripSubscriptions.get(tripId).lastStatus = status;
            }
            // Forward the update to all WebSocket clients subscribed to this trip
            if (wsClients.has(tripId)) {
                const message = {
                    type: 'trip_update',
                    payload: event.payload,
                };
                wsClients.get(tripId).forEach((socket) => {
                    socket.emit('trip_update', message);
                });
                console.log(`Forwarded update to ${wsClients.get(tripId).size} clients for trip ${tripId}`);
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
});
// Start the server
const port = process.env.PORT || 1738;
httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
