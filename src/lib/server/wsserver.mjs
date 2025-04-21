// src/lib/server/svixserver.mjs
import { Svix } from 'svix';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables from .env.local
dotenv.config({ path: '../../.env' });

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, { 
  cors: { origin: '*' } 
});

// Get Svix API key from environment variables
const svixApiKey = process.env.SVIX_API_KEY || 'test_api_key';

// Initialize Svix client
const svix = new Svix(svixApiKey);

// Store for active app-endpoint relationships and webhooks
const tripSubscriptions = new Map();
const webhookSecret = process.env.WEBHOOK_SECRET || 'your_webhook_secret';

// WebSocket connections by tripId
const wsClients = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('subscribe_trip', (data) => {
    try {
      const tripId = data.tripId;
      
      // Add client to trip's subscribers
      if (!wsClients.has(tripId)) {
        wsClients.set(tripId, new Set());
      }
      wsClients.get(tripId).add(socket);
      
      console.log(`Client subscribed to trip ${tripId}`);
      
      // Send initial status if available
      if (tripSubscriptions.has(tripId)) {
        const lastStatus = tripSubscriptions.get(tripId).lastStatus || 'scheduled';
        socket.emit('trip_update', {
          type: 'trip_update',
          payload: { tripId, status: lastStatus, timestamp: Date.now() }
        });
      } else {
        // Send default status
        socket.emit('trip_update', {
          type: 'trip_update',
          payload: { tripId, status: 'scheduled', timestamp: Date.now() }
        });
      }
    } catch (error) {
      console.error('Error processing subscribe message:', error);
    }
  });
  
  socket.on('unsubscribe_trip', (data) => {
    try {
      const tripId = data.tripId;
      
      // Remove client from trip's subscribers
      if (wsClients.has(tripId)) {
        wsClients.get(tripId).delete(socket);
        if (wsClients.get(tripId).size === 0) {
          wsClients.delete(tripId);
        }
      }
      
      console.log(`Client unsubscribed from trip ${tripId}`);
    } catch (error) {
      console.error('Error processing unsubscribe message:', error);
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
    } catch (err) {
      // If not found, create a new app
      return await svix.application.create({
        name: appName,
        uid: appName
      });
    }
  } catch (error) {
    console.error(`Error managing Svix app for trip ${tripId}:`, error);
    throw error;
  }
}

// Endpoint to create Svix webhook endpoint for a trip
app.post('/api/setup-trip-webhook', async (req, res) => {
  try {
    const { tripId } = req.body;
    
    if (!tripId) {
      return res.status(400).json({ error: 'Missing tripId' });
    }
    
    // Get or create app for this trip
    const app = await getOrCreateAppForTrip(tripId);
    
    // Get the webhook URL for our server
    const webhookUrl = `${process.env.SERVER_URL || 'http://localhost:1738'}/api/webhooks/trip-updates`;
    
    // Create endpoint for our server
    const endpoint = await svix.endpoint.create(app.id, {
      url: webhookUrl,
      description: `Endpoint for trip ${tripId} updates`,
      version: 1
    });
    
    // Store subscription info
    tripSubscriptions.set(tripId, {
      appId: app.id,
      endpointId: endpoint.id,
      lastStatus: 'scheduled'
    });
    
    // Send initial status
    await svix.message.create(app.id, {
      eventType: 'trip_update',
      payload: {
        tripId,
        status: 'scheduled',
        timestamp: Date.now()
      }
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Webhook endpoint created for trip updates',
      tripId
    });
  } catch (error) {
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
    const webhook = new svix.Webhook(webhookSecret);
    let event;
    
    try {
      event = webhook.verify(
        JSON.stringify(req.body),
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature
        }
      );
    } catch (error) {
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
          payload: event.payload
        };
        
        wsClients.get(tripId).forEach((socket) => {
          socket.emit('trip_update', message);
        });
        
        console.log(`Forwarded update to ${wsClients.get(tripId).size} clients for trip ${tripId}`);
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Simulate random updates to trips (for demo purposes)
setInterval(async () => {
  const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  
  for (const [tripId, subscription] of tripSubscriptions.entries()) {
    try {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const update = {
        eventType: 'trip_update',
        payload: { 
          tripId, 
          status, 
          timestamp: Date.now() 
        }
      };
      
      // Send update via Svix
      await svix.message.create(subscription.appId, update);
    } catch (error) {
      console.error(`Error sending trip update for ${tripId}:`, error);
    }
  }
}, 5000);

// Start the server
const port = process.env.PORT || 1738;
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

