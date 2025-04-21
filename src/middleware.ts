import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { ClerkMiddlewareAuthObject } from '@clerk/nextjs/server';
import { whitelist, isWhitelistedIP, isValidIPv4 } from '@/utils/constants/whitelist';

export default clerkMiddleware(
    async (auth, req) => {
        const url = req.nextUrl.pathname;
        const paymentCallbackRoute = '/api/webhooks/stk-callback';

        // IP validation for payment callback route
        if (url === paymentCallbackRoute) {
            // Extract client IP from x-forwarded-for header
            const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

            if (!clientIp) {
                console.warn('Middleware - No client IP detected for payment callback');
                return NextResponse.redirect(new URL('/not-found', req.url));
            }

            // Validate IP format
            if (!isValidIPv4(clientIp)) {
                console.warn(`Middleware - Invalid IP format: ${clientIp}`);
                return NextResponse.redirect(new URL('/not-found', req.url));
            }

            // Check if the IP is in the whitelist
            if (!isWhitelistedIP(clientIp)) {
                console.warn(`Middleware - IP ${clientIp} not whitelisted for payment callback`);
                return NextResponse.redirect(new URL('/not-found', req.url));
            }

            console.info(`Middleware - IP ${clientIp} whitelisted for payment callback`);
            return NextResponse.next();
        }

        // Authentication logic for other routes
        try {
            const authResult: ClerkMiddlewareAuthObject = await auth();
            const { userId } = authResult;

            console.debug(`Middleware - Path: ${url}, UserId: ${userId || 'none'}`);

            if (!userId && url.startsWith('/dashboard')) {
                console.info('Middleware - Unauthenticated user, redirecting to /auth/sign-in');
                return NextResponse.redirect(new URL('/auth/sign-in', req.url));
            }

            if (userId && (url.startsWith('/auth/sign-in') || url.startsWith('/auth/sign-up'))) {
                console.info('Middleware - Authenticated user, redirecting to /dashboard');
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            console.debug('Middleware - Proceeding without redirect');
            return NextResponse.next();
        } catch (error) {
            console.error('Middleware - Authentication error:', error);
            return NextResponse.redirect(new URL('/not-found', req.url));
        }
    },
    { debug: true },
);

export const config = {
    matcher: [
        '/((?!.*\\..*|_next).*)', // Match all pages except static files and _next
        '/(api|trpc)(.*)', // Match API and TRPC routes
        '/dashboard(.*)', // Match dashboard routes
        '/',
        '/reserve',
        '/auth/sign-in',
        '/auth/sign-up',
        '/api/webhooks/stk-callback', // Match payment callback route
    ],
};
