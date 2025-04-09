// src/app/(main)/dashboard/layout.tsx
import React from 'react';
import { Navbar, Footer } from '@/components';
import AppSidebar from '@/components/navigation/appSidebar';
import { Role } from '@/utils/constants/roles';

interface Props {
    children: React.ReactNode;
    role?: Role;
}

const DashboardLayout = ({ children, role }: Props) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex flex-1 relative">
                <div
                    id="home"
                    className="absolute inset-0 h-full bg-[linear-gradient(to_right,#161616_0.5px,transparent_0.5px),linear-gradient(to_bottom,#161616_0.5px,transparent_0.5px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] dark:bg-[linear-gradient(to_right,#e2e8f0_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e2e8f0_0.5px,transparent_0.5px)] z-[-1] opacity-50"
                />
                {role && (
                    <AppSidebar
                        role={role}
                        className="sticky top-20 h-[calc(100vh-5rem)] z-10"
                    />
                )}
                <main className="flex-1 relative z-0">{children}</main>
            </div>
            <Footer />
        </div>
    );
};

export default DashboardLayout;
