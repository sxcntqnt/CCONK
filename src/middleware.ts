// src/middleware.ts
// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { ClerkMiddlewareAuthObject } from '@clerk/nextjs/server';
import { whitelist, WhitelistIP } from '@/utils/constants/whitelist';

export default clerkMiddleware(
    async (auth, req) => {
        const url = req.nextUrl.pathname;
        const paymentCallbackRoute = '/reserve/paymentCallback';

        // IP validation only for payment callback route
        if (url === paymentCallbackRoute) {
            // Get IP using your suggested approach
            const clientIp = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip) as
                | string
                | undefined;

            if (!clientIp) {
                console.log('Middleware - No IP detected in payment callback request');
                return new NextResponse(JSON.stringify({ error: 'Unable to determine source IP' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Check if the IP is in the whitelist
            const isWhitelisted = whitelist.some((entry: WhitelistIP) => entry.ip === clientIp);
            if (!isWhitelisted) {
                console.log(`Middleware - IP ${clientIp} not whitelisted for payment callback`);
                return new NextResponse(JSON.stringify({ error: 'IP not authorized' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // If IP is valid, proceed without further auth checks for this route
            console.log(`Middleware - IP ${clientIp} whitelisted for payment callback`);
            return NextResponse.next();
        }

        // Existing auth logic (applies to all routes except payment callback)
        const authResult: ClerkMiddlewareAuthObject = await auth();
        const { userId } = authResult;

        console.log('Middleware - Path:', url, 'userId:', userId);

        if (!userId && url.startsWith('/dashboard')) {
            console.log('Middleware - Redirecting to /auth/sign-in (unauthenticated)');
            return NextResponse.redirect(new URL('/auth/sign-in', req.url));
        }

        if (userId && (url.startsWith('/auth/sign-in') || url.startsWith('/auth/sign-up'))) {
            console.log('Middleware - Redirecting to /dashboard (authenticated)');
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        console.log('Middleware - Proceeding without redirect');
        return NextResponse.next();
    },
    { debug: true },
);

export const config = {
    matcher: [
        '/((?!.*\\..*|_next).*)',
        '/(api|trpc)(.*)',
        '/dashboard(.*)',
        '/',
        '/auth/sign-in',
        '/auth/sign-up',
        '/reserve/paymentCallback', // Explicitly include the payment callback route
    ],
};
