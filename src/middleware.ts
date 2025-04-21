import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { whitelist, isWhitelistedIP, isValidIPv4 } from '@/utils/constants/whitelist';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/auth/sign-in',
    '/auth/sign-up',
    '/api/webhooks/stk-callback',
    '/not-found',
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl.pathname;
    const paymentCallbackRoute = '/api/webhooks/stk-callback';

    // Handle payment callback route with IP whitelisting
    if (url === paymentCallbackRoute) {
        try {
            // Safely extract client IP
            const clientIp =
                req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

            console.info(`Middleware - Payment callback IP: ${clientIp}`);

            if (!isValidIPv4(clientIp)) {
                console.warn(`Middleware - Invalid or missing IP: ${clientIp}`);
                return NextResponse.redirect(new URL('/not-found', req.url));
            }

            if (!isWhitelistedIP(clientIp)) {
                console.warn(`Middleware - IP ${clientIp} not whitelisted`);
                return NextResponse.redirect(new URL('/not-found', req.url));
            }

            console.info(`Middleware - IP ${clientIp} whitelisted for payment callback`);
            return NextResponse.next();
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Middleware - Payment callback error: ${error.message}`);
            } else {
                console.error('Middleware - Payment callback error:', error);
            }
            return NextResponse.redirect(new URL('/not-found', req.url));
        }
    }

    // Handle other routes with authentication
    try {
        const { userId } = await auth(); // <-- FIXED: Await the auth call

        console.debug(`Middleware - Path: ${url}, UserId: ${userId || 'none'}`);

        if (!userId && !isPublicRoute(req)) {
            console.info(`Middleware - Unauthenticated user accessing ${url}, redirecting to /auth/sign-in`);
            return NextResponse.redirect(new URL('/auth/sign-in', req.url));
        }

        if (userId && isPublicRoute(req) && url.startsWith('/auth/')) {
            console.info(`Middleware - Authenticated user accessing ${url}, redirecting to /dashboard`);
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        console.debug('Middleware - Proceeding without redirect');
        return NextResponse.next();
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Middleware - Authentication error: ${error.message}`);
        } else {
            console.error('Middleware - Authentication error:', error);
        }
        return NextResponse.redirect(new URL('/not-found', req.url));
    }
});
export const config = {
    matcher: [
        // Match all pages except static files and _next
        '/((?!.*\\..*|_next).*)',
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
