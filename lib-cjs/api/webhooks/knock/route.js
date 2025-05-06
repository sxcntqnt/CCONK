"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.GET = GET;
const server_1 = require("@clerk/nextjs/server");
const clerk_webhooks_handler_1 = require("@brianmmdev/clerk-webhooks-handler");
const node_1 = require("@knocklabs/node");
const server_2 = require("next/server");
const server_3 = require("@clerk/nextjs/server");
const lib_1 = require("@/lib");
const roles_1 = require("@/utils/constants/roles");
const knock = new node_1.Knock(process.env.KNOCK_API_SECRET ?? '');
if (!process.env.KNOCK_API_SECRET) {
    console.error('KNOCK_API_SECRET is not defined');
}
const handler = (0, clerk_webhooks_handler_1.createWebhooksHandler)({
    onUserCreated: async (payload) => {
        const roleFromMetadata = payload?.unsafe_metadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(roles_1.ROLES).includes(roleFromMetadata) ? roleFromMetadata : roles_1.ROLES.PASSENGER;
        await knock.users.identify(payload.id, {
            name: payload.first_name || '',
            email: payload.email_addresses.find((email) => email.id === payload.primary_email_address_id)?.email_address ||
                '',
            role,
        });
    },
    onUserUpdated: async (payload) => {
        const roleFromMetadata = payload?.unsafe_metadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(roles_1.ROLES).includes(roleFromMetadata) ? roleFromMetadata : roles_1.ROLES.PASSENGER;
        await knock.users.identify(payload.id, {
            name: payload.first_name || '',
            email: payload.email_addresses.find((email) => email.id === payload.primary_email_address_id)?.email_address ||
                '',
            role,
        });
    },
    onSessionCreated: async (payload) => {
        const client = await (0, server_1.clerkClient)(); // Await the factory function
        const user = await client.users.getUser(payload.user_id);
        const roleFromMetadata = user.unsafeMetadata?.role?.toUpperCase().trim();
        const role = roleFromMetadata && Object.values(roles_1.ROLES).includes(roleFromMetadata) ? roleFromMetadata : roles_1.ROLES.PASSENGER;
        await knock.users.identify(payload.user_id, {
            name: user.firstName || '',
            email: user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress || '',
            role,
        });
    },
});
async function GET(request) {
    try {
        const authResult = await (0, server_3.auth)();
        const { userId } = authResult;
        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }
        const prismaUser = await lib_1.db.user.findUnique({
            where: { clerkId: userId },
        });
        if (!prismaUser) {
            return new Response('User not found', { status: 404 });
        }
        const notifications = await lib_1.db.notification.findMany({
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
        return server_2.NextResponse.json({ notifications });
    }
    catch (error) {
        console.error('Error processing request:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
exports.POST = handler.POST;
