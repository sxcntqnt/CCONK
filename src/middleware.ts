// /src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/reserve(.*)']);
const isAuthRoute = createRouteMatcher(['/auth/sign-in', '/auth/sign-up']);

export default clerkMiddleware((auth, req) => {
    const { userId } = auth();
    console.log('Middleware - userId:', userId, 'path:', req.nextUrl.pathname);

    if (!userId && isProtectedRoute(req)) {
        console.log('Middleware - No userId, redirecting to /auth/sign-in');
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
    }

    if (userId && isAuthRoute(req)) {
        console.log('Middleware - Authenticated user, redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!.*\\..*|_next).*)', // Match all non-static, non-_next routes
        '/(api|trpc)(.*)', // API routes
        '/dashboard(.*)', // Dashboard and sub-routes
        '/reserve(.*)', // Reserve and sub-routes
        '/auth/sign-in', // Sign-in route
        '/auth/sign-up', // Sign-up route
    ],
};
