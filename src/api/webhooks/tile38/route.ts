import { NextResponse } from 'next/server';
import { saveGeofenceEvent } from '@/lib/dbGeofenceEvents';

// Tile38 webhook event payload
interface Tile38WebhookEvent {
    command: string;
    group: string;
    detect: 'enter' | 'exit' | 'inside' | 'outside' | 'crosses';
    hook: string;
    key: string;
    time: string;
    id: string; // busId in our case
    object: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    meta?: {
        secret?: string;
    };
}

const TILE38_WEBHOOK_SECRET = process.env.TILE38_WEBHOOK_SECRET;

if (!TILE38_WEBHOOK_SECRET) {
    throw new Error('TILE38_WEBHOOK_SECRET is not set in environment variables');
}

export async function POST(request: Request) {
    try {
        const event: Tile38WebhookEvent = await request.json();

        // Verify secret token
        if (!event.meta?.secret || event.meta.secret !== TILE38_WEBHOOK_SECRET) {
            throw new Error('Invalid or missing webhook secret');
        }

        // Only handle ENTER and EXIT events
        if (event.detect !== 'enter' && event.detect !== 'exit') {
            return NextResponse.json({ ok: true, message: 'Ignored event type' }, { status: 200 });
        }

        // Extract busId from event.id (e.g., "bus123" -> 123)
        const busIdMatch = event.id.match(/^bus(\d+)$/);
        if (!busIdMatch) {
            throw new Error(`Invalid bus ID format: ${event.id}`);
        }
        const busId = parseInt(busIdMatch[1], 10);

        // Extract geofenceId from hook name (e.g., "geofence123" -> 123)
        const geofenceIdMatch = event.hook.match(/^geofence(\d+)$/);
        if (!geofenceIdMatch) {
            throw new Error(`Invalid geofence ID format: ${event.hook}`);
        }
        const geofenceId = parseInt(geofenceIdMatch[1], 10);

        // Save geofence event (this will trigger Svix webhooks)
        const savedEvent = await saveGeofenceEvent({
            busId,
            geofenceId,
            event: event.detect.toUpperCase() as 'ENTER' | 'EXIT',
        });

        return NextResponse.json({ ok: true, event: savedEvent }, { status: 200 });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Geofence webhook error: ${errorMsg}`);
        return NextResponse.json({ ok: false, error: errorMsg }, { status: 401 });
    }
}
