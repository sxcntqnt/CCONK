import { clerkClient } from '../../../../src/clerk/nextjs/server.mjs';
import { createWebhooksHandler } from '../../../../src/brianmmdev/clerk-webhooks-handler.mjs';
import { Knock } from '../../../../src/knocklabs/node.mjs';
import { NextResponse } from 'next/server';
import { auth } from '../../../../src/clerk/nextjs/server.mjs';
import { db } from '../../../../src/lib/index.mjs';
import { ROLES } from '../../../../src/utils/constants/roles.mjs';
const knock = new Knock(process.env.KNOCK_API_SECRET ?? '');
if (!process.env.KNOCK_API_SECRET) {
    console.error('KNOCK_API_SECRET is not defined');
}
const handler = createWebhooksHandler({
    onUserCreated: async (payload) => {
        const roleFromMetadata = payload?.unsafe_metadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(ROLES).includes(roleFromMetadata) ? roleFromMetadata : ROLES.PASSENGER;
        await knock.users.identify(payload.id, {
            name: payload.first_name || '',
            email: payload.email_addresses.find((email) => email.id === payload.primary_email_address_id)?.email_address ||
                '',
            role,
        });
    },
    onUserUpdated: async (payload) => {
        const roleFromMetadata = payload?.unsafe_metadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(ROLES).includes(roleFromMetadata) ? roleFromMetadata : ROLES.PASSENGER;
        await knock.users.identify(payload.id, {
            name: payload.first_name || '',
            email: payload.email_addresses.find((email) => email.id === payload.primary_email_address_id)?.email_address ||
                '',
            role,
        });
    },
    onSessionCreated: async (payload) => {
        const client = await clerkClient(); // Await the factory function
        const user = await client.users.getUser(payload.user_id);
        const roleFromMetadata = user.unsafeMetadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(ROLES).includes(roleFromMetadata) ? roleFromMetadata : ROLES.PASSENGER;
        await knock.users.identify(payload.user_id, {
            name: user.firstName || '',
            email: user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress || '',
            role,
        });
    },
});
export async function GET(request) {
    try {
        const authResult = await auth();
        const { userId } = authResult;
        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }
        const prismaUser = await db.user.findUnique({
            where: { clerkId: userId },
        });
        if (!prismaUser) {
            return new Response('User not found', { status: 404 });
        }
        const notifications = await db.notification.findMany({
            where: {
                userId: prismaUser.id,
                status: 'sent',
            },
            orderBy: { sentAt: 'desc' },
            take: 50,
            include: {
                trip: { select: { id: true } },
                driver: { select: { id: true } },
            },
        });
        return NextResponse.json({ notifications });
    }
    catch (error) {
        console.error('Error processing request:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
export const POST = handler.POST;
