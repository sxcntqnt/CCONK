"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const server_1 = require("@clerk/nextjs/server");
const server_2 = require("next/server");
const whitelist_1 = require("@/utils/constants/whitelist");
// Define public routes that don't require authentication
const isPublicRoute = (0, server_1.createRouteMatcher)([
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
    '/enterprise',
    '/drivers',
    '/api/webhooks/stk-callback',
    '/not-found',
]);
exports.default = (0, server_1.clerkMiddleware)(async (auth, req) => {
    const url = req.nextUrl.pathname;
    const paymentCallbackRoute = '/api/webhooks/stk-callback';
    // Handle payment callback route with IP whitelisting
    if (url === paymentCallbackRoute) {
        try {
            // Safely extract client IP
            const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                req.headers.get('x-real-ip') ||
                'unknown';
            console.info(`Middleware - Payment callback IP: ${clientIp}`);
            if (!(0, whitelist_1.isValidIPv4)(clientIp)) {
                console.warn(`Middleware - Invalid or missing IP: ${clientIp}`);
                return server_2.NextResponse.redirect(new URL('/not-found', req.url));
            }
            if (!(0, whitelist_1.isWhitelistedIP)(clientIp)) {
                console.warn(`Middleware - IP ${clientIp} not whitelisted`);
                return server_2.NextResponse.redirect(new URL('/not-found', req.url));
            }
            console.info(`Middleware - IP ${clientIp} whitelisted for payment callback`);
            return server_2.NextResponse.next();
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Middleware - Payment callback error: ${error.message}`);
            }
            else {
                console.error('Middleware - Payment callback error:', error);
            }
            return server_2.NextResponse.redirect(new URL('/not-found', req.url));
        }
    }
    // Handle other routes with authentication
    try {
        const { userId } = await auth(); // <-- FIXED: Await the auth call
        console.debug(`Middleware - Path: ${url}, UserId: ${userId || 'none'}`);
        if (!userId && !isPublicRoute(req)) {
            console.info(`Middleware - Unauthenticated user accessing ${url}, redirecting to /auth/sign-in`);
            return server_2.NextResponse.redirect(new URL('/auth/sign-in', req.url));
        }
        if (userId && isPublicRoute(req) && url.startsWith('/auth/')) {
            console.info(`Middleware - Authenticated user accessing ${url}, redirecting to /dashboard`);
            return server_2.NextResponse.redirect(new URL('/dashboard', req.url));
        }
        console.debug('Middleware - Proceeding without redirect');
        return server_2.NextResponse.next();
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Middleware - Authentication error: ${error.message}`);
        }
        else {
            console.error('Middleware - Authentication error:', error);
        }
        return server_2.NextResponse.redirect(new URL('/not-found', req.url));
    }
}, { debug: true });
exports.config = {
    matcher: [
        // Match all pages except static files and _next
        '/((?!.*\\..*|_next).*)',
        '/', // Explicitly include the homepage
        // Match specific routes
        '/auth/sign-in',
        '/auth/sign-up',
        '/not-found',
        '/dashboard(.*)',
        '/reserve',
        '/vehicle',
        '/drivers',
        '/customer',
        '/fuel',
        '/reminder',
        '/income-expenses',
        '/tracking',
        '/geofence',
        '/reports',
        '/users',
        '/changepassword',
        '/settings',
        '/logout',
        // Match payment callback
        '/api/webhooks/stk-callback',
    ],
};
