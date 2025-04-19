// components/providers.tsx
'use client';

import React from 'react';
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
    const { user } = useUser();
    const { getToken } = useAuth(); // Get Clerk JWT
    const [knockToken, setKnockToken] = React.useState<string | null>(null);

    // Fetch Clerk JWT for Knock
    React.useEffect(() => {
        async function fetchToken() {
            try {
                const token = await getToken(); // Get Clerk's default JWT
                setKnockToken(token);
            } catch (error) {
                console.error('Failed to fetch Clerk token:', error);
            }
        }
        if (user?.id) {
            fetchToken();
        }
    }, [user?.id, getToken]);

    if (!user?.id || !knockToken) {
        // Render nothing or a loading state until token is ready
        return null;
    }

    return (
        <KnockProvider
            apiKey={KNOCK_PUBLIC_API_KEY}
            userId={user.id}
            userToken={knockToken} // Pass Clerk JWT as Knock user token
        >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <SidebarProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </SidebarProvider>
            </ThemeProvider>
        </KnockProvider>
    );
};

const Providers = ({ children }: Props) => {
    const client = new QueryClient();

    return (
        <QueryClientProvider client={client}>
            <ClerkProvider>
                <InnerProviders>{children}</InnerProviders>
            </ClerkProvider>
        </QueryClientProvider>
    );
};

export default Providers;
