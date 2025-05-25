'use client';

import React, { Suspense, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider, useTheme } from 'next-themes';

interface Props {
    children: React.ReactNode;
}

const Providers = ({ children }: Props) => {
    const { user, isLoaded: userLoaded } = useUser();
    const { setTheme } = useTheme();
    const queryClient = new QueryClient();

    // Initialize theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, [setTheme]);

    // Show loading state until Clerk user data is loaded
    if (!userLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-300">Loading authentication...</div>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
                <SidebarProvider>
                    <TooltipProvider>
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center min-h-screen text-gray-300">
                                    Loading...
                                </div>
                            }
                        >
                            {children}
                        </Suspense>
                    </TooltipProvider>
                </SidebarProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default Providers;
