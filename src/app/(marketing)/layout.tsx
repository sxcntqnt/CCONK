// src/app/[nested]/layout.tsx
import React from 'react';
import { Navbar, Footer } from '@/components';
import { cn } from '@/utils';

interface Props {
    children: React.ReactNode;
}

const MarketingLayout = ({ children }: Props) => {
    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Decorative Background Grid */}
            <div
                id="home"
                className="absolute inset-0 min-h-screen bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] z-[-1]"
            />
            {/* Navbar */}
            <Navbar className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--background))]" />
            {/* Main Content with Functional Grid */}
            <main
                className={cn(
                    'relative z-0 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16',
                    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min',
                )}
            >
                {children}
            </main>
            {/* Footer */}
            <Footer className="z-10 bg-[hsl(var(--background))]" />
        </div>
    );
};

export default MarketingLayout;
