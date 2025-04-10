// src/app/(marketing)/layout.tsx (adjust path as needed)
import React from 'react';
import { Navbar, Footer } from '@/components';

interface Props {
    children: React.ReactNode;
}

const MarketingLayout = ({ children }: Props) => {
    return (
        <div className="flex flex-col min-h-screen">
            <div
                id="home"
                className="absolute inset-0 h-full bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]"
            />
            <Navbar />
            <main className="relative z-0 flex-1 mx-auto mt-20 w-full">{children}</main>
            <Footer />
        </div>
    );
};

export default MarketingLayout;
