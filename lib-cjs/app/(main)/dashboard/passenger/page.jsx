"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PassengerPage;
// src/app/(main)/dashboard/passenger/page.tsx
const server_1 = require("@clerk/nextjs/server");
const navigation_1 = require("next/navigation");
const prisma_1 = require("@/lib/prisma");
const client_1 = __importDefault(require("./client"));
const roles_1 = require("@/utils/constants/roles");
async function withRetry(operation, maxAttempts = 3, delayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}
async function getPassengerData(clerkId) {
    const passenger = await withRetry(async () => {
        const result = await prisma_1.db.user.findUnique({
            where: { clerkId },
            include: {
                reservations: {
                    where: { status: 'confirmed' },
                    include: { trip: { include: { bus: true } } },
                    orderBy: { bookedAt: 'desc' },
                },
            },
        });
        if (!result || result.role !== 'PASSENGER') {
            throw new Error('User is not a passenger');
        }
        return result;
    });
    const buses = await withRetry(async () => {
        return await prisma_1.db.bus.findMany({
            where: { trips: { some: { status: 'scheduled' } } },
            take: 10,
        });
    });
    return { passenger, buses };
}
async function PassengerPage() {
    const user = await (0, server_1.currentUser)();
    // Redirect to sign-in if user is not authenticated
    if (!user) {
        (0, navigation_1.redirect)('/auth/sign-in');
    }
    const rawRole = user.unsafeMetadata.role?.toUpperCase().trim();
    const role = rawRole || roles_1.ROLES.PASSENGER;
    // Redirect non-PASSENGER roles
    switch (role) {
        case roles_1.ROLES.PASSENGER:
            break;
        case roles_1.ROLES.DRIVER:
            (0, navigation_1.redirect)('/dashboard/driver');
        case roles_1.ROLES.OWNER:
            (0, navigation_1.redirect)('/dashboard/owner');
        default:
            (0, navigation_1.redirect)('/');
    }
    const userData = {
        id: user.id,
        firstName: user.firstName || 'Passenger',
    };
    try {
        const { passenger, buses } = await getPassengerData(user.id);
        return (<client_1.default userData={userData} passenger={passenger} buses={buses} error={null} role={role}/>);
    }
    catch (error) {
        console.error('Error fetching passenger data:', error);
        return (<client_1.default userData={userData} passenger={null} buses={[]} error={error instanceof Error ? error.message : 'Failed to load dashboard data'} role={role}/>);
    }
}
