import { Svix } from 'svix';
import { db } from '@/lib/prisma';

const SVIX_AUTH_TOKEN = process.env.SVIX_AUTH_TOKEN;

if (!SVIX_AUTH_TOKEN) {
    throw new Error('SVIX_AUTH_TOKEN is not set');
}

const svix = new Svix(SVIX_AUTH_TOKEN);

export async function ensureSvixApplication(clerkId: string): Promise<string> {
    try {
        const appId = `user_${clerkId}`;
        const existingApp = await svix.application.get(appId).catch(() => null);
        if (!existingApp) {
            await svix.application.create({
                name: `User ${clerkId}`,
                uid: appId,
            });
            console.log(`Created Svix application for user ${clerkId}`);
        }
        return appId;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`ensureSvixApplication error for clerkId ${clerkId}: ${errorMsg}`);
        throw new Error(`Failed to ensure Svix application: ${errorMsg}`);
    }
}

export async function createSvixEndpoint(
    clerkId: string,
    url: string,
    eventTypes: string[] = ['geofence.enter', 'geofence.exit'],
): Promise<void> {
    try {
        const appId = await ensureSvixApplication(clerkId);
        await svix.endpoint.create(appId, {
            url,
            eventTypes,
            description: `Geofence webhook for user ${clerkId}`,
        });
        console.log(`Created Svix endpoint for user ${clerkId}: ${url}`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`createSvixEndpoint error for clerkId ${clerkId}: ${errorMsg}`);
        throw new Error(`Failed to create Svix endpoint: ${errorMsg}`);
    }
}

export async function getSvixAppPortalUrl(clerkId: string): Promise<string> {
    try {
        const appId = await ensureSvixApplication(clerkId);
        const portal = await svix.applicationPortalAccess.create(appId, {
            featureFlags: ['endpoints', 'logs', 'replay'],
        });
        return portal.url;
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`getSvixAppPortalUrl error for clerkId ${clerkId}: ${errorMsg}`);
        throw new Error(`Failed to get Svix App Portal URL: ${errorMsg}`);
    }
}
