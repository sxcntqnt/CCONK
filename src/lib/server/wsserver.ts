import { PrismaClient } from '@/lib/prisma/client';
import { Svix, Webhook } from 'svix';
import express, { Request, Response, RequestHandler } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getTripIdForDriver, updateTripStatus, getDriverById, TripStatus, DriverStatus } from '@/utils/index';

// Load environment variables
dotenv.config({ path: './.env' });

// Initialize Express app
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(bodyParser.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
    transports: ['websocket'],
});

// Initialize Prisma client
const db = new PrismaClient();

// Get Svix API key from environment variables
const svixApiKey = process.env.SVIX_API_KEY;
if (!svixApiKey) {
    console.error('SVIX_API_KEY is not set');
    process.exit(1);
}

// Initialize Svix client
const svix = new Svix(svixApiKey);

// Store for active app-endpoint relationships and webhooks
const tripSubscriptions = new Map<string, { appId: string; endpointId: string; lastStatus: string }>();
const webhookSecret = process.env.WEBHOOK_SECRET || 'your_webhook_secret';

// WebSocket connections by tripId, driverId, and reservationId_userId
const wsClients = new Map<string, Set<any>>();

// Schedule message cleanup for completed trips
async function scheduleMessageCleanup(tripId: number): Promise<void> {
    const deletionTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    try {
        await db.message.updateMany({
            where: {
                tripId,
                deletedAt: null,
            },
            data: {
                deletedAt: deletionTime,
            },
        });
        console.log(`Scheduled cleanup for messages of trip ${tripId} at ${deletionTime}`);
    } catch (error) {
        console.error(`Error scheduling cleanup for trip ${tripId}:`, error);
    }
}

// Periodic cleanup of expired messages
setInterval(
    async () => {
        try {
            const now = new Date();
            const deletedCount = await db.message.deleteMany({
                where: {
                    deletedAt: {
                        lte: now,
                    },
                },
            });
            if (deletedCount.count > 0) {
                console.log(`Deleted ${deletedCount.count} expired messages`);
            }
        } catch (error) {
            console.error('Error in message cleanup:', error);
        }
    },
    60 * 60 * 1000,
); // Run every hour

// Prisma middleware to broadcast reservation updates
db.$use(async (params, next) => {
    if (params.model === 'Reservation' && params.action === 'create') {
        const reservation = await next(params);
        const driverId = reservation.trip?.driverId?.toString();
        if (driverId && wsClients.has(`reservations_${driverId}`)) {
            const reservationCount = await db.reservation.count({
                where: { trip: { driverId: Number(driverId) } },
            });
            wsClients.get(`reservations_${driverId}`)!.forEach((socket) => {
                socket.emit('reservation_update', {
                    type: 'reservation_update',
                    payload: { driverId, reservationCount, timestamp: Date.now() },
                });
            });
        }
        return reservation;
    }
    return next(params);
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected');

    // Subscribe to trip updates
    socket.on('subscribe_trip', async (data: { tripId: string }) => {
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
            wsClients.get(tripId)!.add(socket);

            console.log(`Client subscribed to trip ${tripId}`);

            // Send initial status
            const lastStatus = tripSubscriptions.get(tripId)?.lastStatus || trip.status || TripStatus.SCHEDULED;
            socket.emit('trip_update', {
                type: 'trip_update',
                payload: { tripId, status: lastStatus, timestamp: Date.now() },
            });
        } catch (error) {
            console.error('Error processing subscribe message:', error);
            socket.emit('error', { error: 'Failed to subscribe to trip' });
        }
    });

    // Unsubscribe from trip updates
    socket.on('unsubscribe_trip', (data: { tripId: string }) => {
        try {
            const { tripId } = data;
            if (!tripId || isNaN(Number(tripId))) {
                socket.emit('error', { error: 'Invalid or missing tripId' });
                return;
            }

            // Remove client from trip's subscribers
            if (wsClients.has(tripId)) {
                wsClients.get(tripId)!.delete(socket);
                if (wsClients.get(tripId)!.size === 0) {
                    wsClients.delete(tripId);
                }
            }

            console.log(`Client unsubscribed from trip ${tripId}`);
        } catch (error) {
            console.error('Error processing unsubscribe message:', error);
            socket.emit('error', { error: 'Failed to unsubscribe from trip' });
        }
    });

    // Subscribe to reservation updates
    socket.on('subscribe_reservations', async (data: { driverId: string }) => {
        try {
            const { driverId } = data;
            if (!driverId || isNaN(Number(driverId))) {
                socket.emit('error', { error: 'Invalid or missing driverId' });
                return;
            }

            // Verify driver exists
            const driver = await db.driver.findUnique({
                where: { id: Number(driverId) },
            });
            if (!driver) {
                socket.emit('error', { error: 'Driver not found' });
                return;
            }

            // Add client to driver's reservation subscribers
            const key = `reservations_${driverId}`;
            if (!wsClients.has(key)) {
                wsClients.set(key, new Set());
            }
            wsClients.get(key)!.add(socket);

            console.log(`Client subscribed to reservations for driver ${driverId}`);

            // Send initial reservation count
            const reservationCount = await db.reservation.count({
                where: {
                    trip: { driverId: Number(driverId) },
                },
            });
            socket.emit('reservation_update', {
                type: 'reservation_update',
                payload: {
                    driverId,
                    reservationCount,
                    timestamp: Date.now(),
                },
            });
        } catch (error) {
            console.error('Error processing subscribe_reservations message:', error);
            socket.emit('error', { error: 'Failed to subscribe to reservations' });
        }
    });

    // Unsubscribe from reservation updates
    socket.on('unsubscribe_reservations', (data: { driverId: string }) => {
        try {
            const { driverId } = data;
            if (!driverId || isNaN(Number(driverId))) {
                socket.emit('error', { error: 'Invalid or missing driverId' });
                return;
            }

            const key = `reservations_${driverId}`;
            if (wsClients.has(key)) {
                wsClients.get(key)!.delete(socket);
                if (wsClients.get(key)!.size === 0) {
                    wsClients.delete(key);
                }
            }

            console.log(`Client unsubscribed from reservations for driver ${driverId}`);
        } catch (error) {
            console.error('Error processing unsubscribe_reservations message:', error);
            socket.emit('error', { error: 'Failed to unsubscribe from reservations' });
        }
    });

    // Subscribe to chat messages
    socket.on('subscribe_chat', async (data: { reservationId: number; userId: number }) => {
        try {
            const { reservationId, userId } = data;
            if (!reservationId || !userId) {
                socket.emit('error', { error: 'Invalid or missing reservationId or userId' });
                return;
            }

            // Verify reservation and trip exist
            const reservation = await db.reservation.findUnique({
                where: { id: reservationId },
                include: { trip: { select: { id: true, driverId: true, status: true, updatedAt: true } } },
            });
            if (!reservation || !reservation.trip) {
                socket.emit('error', { error: 'Reservation or trip not found' });
                return;
            }

            // Check if user is authorized for the chat (either passenger or driver)
            const isPassenger = reservation.userId === userId;
            const driver = reservation.trip.driverId
                ? await db.driver.findUnique({ where: { id: reservation.trip.driverId } })
                : null;
            const isDriver = driver && driver.userId === userId;
            if (!isPassenger && !isDriver) {
                socket.emit('error', { error: 'User not authorized for this chat' });
                return;
            }

            // Check if trip is completed and messages are expired
            if (reservation.trip.status === TripStatus.COMPLETED && reservation.trip.updatedAt) {
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (new Date().getTime() - new Date(reservation.trip.updatedAt).getTime() > twentyFourHours) {
                    socket.emit('error', { error: 'Chat messages have expired' });
                    await db.message.updateMany({
                        where: { reservationId, deletedAt: null },
                        data: { deletedAt: new Date() },
                    });
                    return;
                }
            }

            // Add client to chat room
            const chatRoom = `chat_${reservationId}`;
            socket.join(chatRoom);
            console.log(`Client ${userId} subscribed to chat for reservation ${reservationId}`);

            // Fetch and send existing messages
            const messages = await db.message.findMany({
                where: {
                    reservationId,
                    deletedAt: null,
                    OR: [{ senderId: userId }, { receiverId: userId }],
                },
                orderBy: { timestamp: 'asc' },
            });

            socket.emit('chat_message', {
                type: 'chat_message',
                payload: messages.map(
                    (msg: {
                        id: number;
                        reservationId: number;
                        tripId: number;
                        senderId: number;
                        receiverId: number;
                        content: string;
                        timestamp: Date;
                    }) => ({
                        id: msg.id,
                        reservationId: msg.reservationId,
                        tripId: msg.tripId,
                        senderId: msg.senderId,
                        receiverId: msg.receiverId,
                        content: msg.content,
                        timestamp: msg.timestamp.toISOString(),
                    }),
                ),
            });
        } catch (error) {
            console.error('Error processing subscribe_chat message:', error);
            socket.emit('error', { error: 'Failed to subscribe to chat' });
        }
    });

    // Unsubscribe from chat messages
    socket.on('unsubscribe_chat', (data: { reservationId: number; userId: number }) => {
        try {
            const { reservationId, userId } = data;
            if (!reservationId || !userId) {
                socket.emit('error', { error: 'Invalid or missing reservationId or userId' });
                return;
            }

            const chatRoom = `chat_${reservationId}`;
            socket.leave(chatRoom);
            console.log(`Client ${userId} unsubscribed from chat for reservation ${reservationId}`);
        } catch (error) {
            console.error('Error processing unsubscribe_chat message:', error);
            socket.emit('error', { error: 'Failed to unsubscribe from chat' });
        }
    });

    // Handle sending chat messages
    socket.on(
        'send_chat_message',
        async (data: {
            id: number;
            reservationId: number;
            tripId: number;
            senderId: number;
            receiverId: number;
            content: string;
            timestamp: string;
        }) => {
            try {
                const { id, reservationId, tripId, senderId, receiverId, content, timestamp } = data;
                if (!reservationId || !tripId || !senderId || !receiverId || !content || !timestamp) {
                    socket.emit('error', { error: 'Invalid message: required fields missing' });
                    return;
                }

                // Verify reservation and trip exist
                const reservation = await db.reservation.findUnique({
                    where: { id: reservationId },
                    include: { trip: { select: { id: true, driverId: true, status: true, updatedAt: true } } },
                });
                if (!reservation || !reservation.trip || reservation.trip.id !== tripId) {
                    socket.emit('error', { error: 'Reservation or trip not found' });
                    return;
                }

                // Check if trip is completed and messages are expired
                if (reservation.trip.status === TripStatus.COMPLETED && reservation.trip.updatedAt) {
                    const twentyFourHours = 24 * 60 * 60 * 1000;
                    if (new Date().getTime() - new Date(reservation.trip.updatedAt).getTime() > twentyFourHours) {
                        socket.emit('error', { error: 'Chat messages have expired' });
                        return;
                    }
                }

                // Verify sender and receiver
                const sender = await db.user.findUnique({ where: { id: senderId } });
                const receiver = await db.user.findUnique({ where: { id: receiverId } });
                if (!sender || !receiver) {
                    socket.emit('error', { error: 'Sender or receiver not found' });
                    return;
                }

                // Save message to database
                const message = await db.message.create({
                    data: {
                        id,
                        reservationId,
                        tripId,
                        senderId,
                        receiverId,
                        content,
                        timestamp: new Date(timestamp),
                    },
                });

                // Broadcast message to chat room
                const messagePayload = {
                    id: message.id,
                    reservationId: message.reservationId,
                    tripId: message.tripId,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content,
                    timestamp: message.timestamp.toISOString(),
                };

                io.to(`chat_${reservationId}`).emit('chat_message', {
                    type: 'chat_message',
                    payload: messagePayload,
                });

                console.log(
                    `Broadcasted chat message for reservation ${reservationId} from ${senderId} to ${receiverId}`,
                );
            } catch (error) {
                console.error('Error processing send_chat_message:', error);
                socket.emit('error', { error: 'Failed to send chat message' });
            }
        },
    );

    // Handle status updates
    // Handle status updates
    socket.on('status_update', async (data: { status: string; driverId: string; destination?: string }) => {
        try {
            const { status, driverId, destination } = data;
            if (!status || !driverId || isNaN(Number(driverId))) {
                socket.emit('error', { error: 'Invalid message: status and driverId required' });
                return;
            }

            // Validate driver
            const driverResponse = await getDriverById(Number(driverId));
            if (driverResponse.error || !driverResponse.data) {
                socket.emit('error', { error: 'Driver not found' });
                return;
            }

            // Define valid client statuses
            type ClientStatus =
                | 'in-transit'
                | 'arrived'
                | 'scheduled'
                | 'in_progress'
                | 'completed'
                | 'cancelled'
                | 'offline';

            const clientStatus = status as ClientStatus;

            // Map client status to TripStatus or DriverStatus
            const tripStatusMap: { [key: string]: TripStatus } = {
                'in-transit': TripStatus.IN_PROGRESS,
                arrived: TripStatus.COMPLETED,
                scheduled: TripStatus.SCHEDULED,
                in_progress: TripStatus.IN_PROGRESS,
                completed: TripStatus.COMPLETED,
                cancelled: TripStatus.CANCELLED,
            };

            const driverStatusMap: { [key: string]: DriverStatus } = {
                offline: DriverStatus.OFFLINE,
            };

            const tripStatus = tripStatusMap[clientStatus];
            const driverStatus = driverStatusMap[clientStatus];

            // Validate status
            if (!tripStatus && !driverStatus) {
                socket.emit('error', { error: `Invalid status: ${status}` });
                return;
            }

            let tripId: string | null = null;
            if (driverStatus === DriverStatus.OFFLINE) {
                // Update driver status to offline
                await db.driver.update({
                    where: { id: Number(driverId) },
                    data: { status: DriverStatus.OFFLINE },
                });
                console.log(`Driver ${driverId} set to offline`);
            } else if (tripStatus) {
                // Get active trip for driver
                const tripResponse = await getTripIdForDriver(Number(driverId));
                if (tripResponse.error || !tripResponse.data) {
                    socket.emit('error', { error: 'No active trip found for driver' });
                    return;
                }
                tripId = tripResponse.data.toString();

                // Update trip status
                const updateResponse = await updateTripStatus(Number(tripId), tripStatus);
                if (updateResponse.error) {
                    socket.emit('error', { error: updateResponse.error });
                    return;
                }

                // Schedule message cleanup if trip is completed
                if (tripStatus === TripStatus.COMPLETED) {
                    await scheduleMessageCleanup(Number(tripId));
                }
            }

            // Broadcast status update via Svix if tripId is available
            if (tripId && tripStatus && tripSubscriptions.has(tripId)) {
                const subscription = tripSubscriptions.get(tripId)!;
                subscription.lastStatus = tripStatus;

                await svix.message.create(subscription.appId, {
                    eventType: 'trip_update',
                    payload: {
                        tripId,
                        status: tripStatus,
                        driverId,
                        message: `Driver with ID ${driverId} is now ${tripStatus}.`,
                        destination: tripStatus === TripStatus.COMPLETED ? destination : undefined,
                        timestamp: Date.now(),
                    },
                });

                console.log(`Broadcasted ${tripStatus} update for trip ${tripId}`);
            }

            socket.emit('success', { status: tripStatus || driverStatus, driverId, destination });
        } catch (error) {
            console.error('Error processing status_update:', error);
            socket.emit('error', { error: 'Failed to process status update' });
        }
    });
    // Handle client disconnection
    socket.on('disconnect', () => {
        for (const [key, clients] of wsClients.entries()) {
            clients.delete(socket);
            if (clients.size === 0) {
                wsClients.delete(key);
            }
        }
        console.log('Client disconnected');
    });
});

// Create or get a Svix application for a trip
async function getOrCreateAppForTrip(tripId: string) {
    try {
        const appName = `trip-${tripId}`;

        // Try to find an existing app
        try {
            return await svix.application.get(appName);
        } catch (err) {
            // Return a new app
            return await svix.application.create({
                name: appName,
                uid: appName,
            });
        }
    } catch (error) {
        console.error(`Error managing Svix app for trip ${tripId}:`, error);
        throw error;
    }
}

// Endpoint to create Svix webhook endpoint for a trip
const setupTripWebhook: RequestHandler = async (req, res): Promise<void> => {
    try {
        const { tripId } = req.body;
        if (!tripId || isNaN(Number(tripId))) {
            res.status(400).json({ error: 'Invalid or missing tripId' });
            return;
        }

        // Verify trip exists
        const trip = await db.trip.findUnique({
            where: { id: Number(tripId) },
        });
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
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
            lastStatus: trip.status || TripStatus.SCHEDULED,
        });

        // Send initial status
        await svix.message.create(app.id, {
            eventType: 'trip_update',
            payload: {
                tripId,
                status: trip.status || TripStatus.SCHEDULED,
                timestamp: Date.now(),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Webhook endpoint created for trip updates',
            tripId,
        });
    } catch (error) {
        console.error('Error setting up trip webhook:', error);
        res.status(500).json({ error: 'Failed to set up trip webhook' });
    }
};

// Webhook endpoint to receive trip updates from Svix
interface SvixWebhookEvent {
    eventType: string;
    payload: {
        tripId: string;
        status: string;
        driverId?: string;
        message?: string;
        destination?: string;
        timestamp: number | undefined;
    };
}

const tripUpdatesWebhook: RequestHandler = async (req, res): Promise<void> => {
    try {
        const svixId = req.headers['svix-id'] as string;
        const svixTimestamp = req.headers['svix-timestamp'] as string;
        const svixSignature = req.headers['svix-signature'] as string;

        if (!svixId || !svixTimestamp || !svixSignature) {
            res.status(400).json({ error: 'Missing Svix headers' });
            return;
        }

        // Verify the webhook signature
        const webhook = new Webhook(webhookSecret);
        const event = webhook.verify(JSON.stringify(req.body), {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as SvixWebhookEvent;

        // Process the webhook event
        if (event.eventType === 'trip_update') {
            const tripId = event.payload.tripId;
            const status = event.payload.status;

            // Store the latest status
            if (tripSubscriptions.has(tripId)) {
                tripSubscriptions.get(tripId)!.lastStatus = status;
            }

            // Schedule message cleanup if trip is completed
            if (status === TripStatus.COMPLETED) {
                await scheduleMessageCleanup(Number(tripId));
            }

            // Forward the update to all WebSocket clients subscribed to this trip
            if (wsClients.has(tripId)) {
                const message = {
                    type: 'trip_update',
                    payload: event.payload,
                };

                wsClients.get(tripId)!.forEach((socket) => {
                    socket.emit('trip_update', message);
                });

                console.log(`Forwarded update to ${wsClients.get(tripId)!.size} clients for trip ${tripId}`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
};

// Register webhook endpoints
app.post('/api/setup-trip-webhook', setupTripWebhook);
app.post('/api/webhooks/trip-updates', tripUpdatesWebhook);

// Start the server
const port = process.env.PORT || 1738;
httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
