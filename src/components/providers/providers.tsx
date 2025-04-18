// components/providers.tsx
'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface Props {
    children: React.ReactNode;
}

const Providers = ({ children }: Props) => {
    const client = new QueryClient();

    return (
        <QueryClientProvider client={client}>
            <ClerkProvider>
                <SidebarProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </SidebarProvider>
            </ClerkProvider>
        </QueryClientProvider>
    );
};

export default Providers;
