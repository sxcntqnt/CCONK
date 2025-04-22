'use client';

import React, { Suspense, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KnockProvider } from '@knocklabs/react';
import { ThemeProvider, useTheme } from 'next-themes';

import '@knocklabs/react/dist/index.css';

const KNOCK_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY || '';

interface Props {
    children: React.ReactNode;
}

const InnerProviders = ({ children }: Props) => {
    const { user, isLoaded: userLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const { setTheme } = useTheme(); // Add useTheme hook
    const [knockToken, setKnockToken] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Load saved theme from localStorage after hydration
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, [setTheme]);

    // Fetch Clerk JWT for Knock
    useEffect(() => {
        async function fetchToken() {
            try {
                const token = await getToken();
                if (token) {
                    setKnockToken(token);
                } else {
                    setError('No Clerk token available');
                }
            } catch (err) {
                console.error('Failed to fetch Clerk token:', err);
                setError('Failed to fetch Clerk token');
            }
        }
        if (userLoaded && isSignedIn && user?.id) {
            fetchToken();
        }
    }, [userLoaded, isSignedIn, user?.id, getToken]);

    const commonProviders = (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Set default theme to dark
            enableSystem={false} // Disable system theme detection
            disableTransitionOnChange
        >
            <SidebarProvider>
                <TooltipProvider>{children}</TooltipProvider>
            </SidebarProvider>
        </ThemeProvider>
    );

    if (!userLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading authentication...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Error: {error}
            </div>
        );
    }

    if (!isSignedIn || !user?.id || !knockToken) {
        return commonProviders;
    }

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
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <InnerProviders>{children}</InnerProviders>
            </Suspense>
        </QueryClientProvider>
    );
};

export default Providers;
