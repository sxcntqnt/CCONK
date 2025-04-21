'use client';

import React, { Suspense } from 'react';
import { ClerkProvider, useUser, useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KnockProvider } from '@knocklabs/react';
import { ThemeProvider } from 'next-themes';

import '@knocklabs/react/dist/index.css';

const KNOCK_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY || '';

interface Props {
    children: React.ReactNode;
}

const InnerProviders = ({ children }: Props) => {
    const { user, isLoaded: userLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [knockToken, setKnockToken] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Fetch Clerk JWT for Knock only for signed-in users
    React.useEffect(() => {
        async function fetchToken() {
            try {
                const token = await getToken(); // Get Clerk's default JWT
                if (token) {
                    setKnockToken(token);
                } else {
                    setError('No Clerk token available');
                }
            } catch (error) {
                console.error('Failed to fetch Clerk token:', error);
                setError('Failed to fetch Clerk token');
            }
        }
        if (userLoaded && isSignedIn && user?.id) {
            fetchToken();
        }
    }, [userLoaded, isSignedIn, user?.id, getToken]);

    // Common providers for all users (authenticated or not)
    const commonProviders = (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SidebarProvider>
                <TooltipProvider>{children}</TooltipProvider>
            </SidebarProvider>
        </ThemeProvider>
    );

    // If user data is not loaded, show a loading state
    if (!userLoaded) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>
                {commonProviders}
            </>
        );
    }

    // If there's an error, show an error state
    if (error) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen">Error: {error}</div>
                {commonProviders}
            </>
        );
    }

    // If user is not signed in or no token, render without KnockProvider
    if (!isSignedIn || !user?.id || !knockToken) {
        return commonProviders;
    }

    // Render with KnockProvider for authenticated users
    return (
        <KnockProvider apiKey={KNOCK_PUBLIC_API_KEY} userId={user.id} userToken={knockToken}>
            {commonProviders}
        </KnockProvider>
    );
};

const Providers = ({ children }: Props) => {
    const queryClient = new QueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <ClerkProvider>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                    <InnerProviders>{children}</InnerProviders>
                </Suspense>
            </ClerkProvider>
        </QueryClientProvider>
    );
};

export default Providers;
