// src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { ClerkMiddlewareAuthObject } from '@clerk/nextjs/server'; // Import type for better typing

export default clerkMiddleware(
    async (auth, req) => {
        // Make the callback async
        const url = req.nextUrl.pathname;
        const authResult: ClerkMiddlewareAuthObject = await auth(); // Await the auth promise
        const { userId } = authResult; // Destructure from the resolved object

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
    },
    { debug: true },
);

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/(api|trpc)(.*)', '/dashboard(.*)', '/', '/auth/sign-in', '/auth/sign-up'],
};
