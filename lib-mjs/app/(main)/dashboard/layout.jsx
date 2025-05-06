// src/app/(main)/dashboard/layout.tsx
import React from 'react';
import { Navbar, Footer } from '@/components';
import AppSidebar from '@/components/dashboard/appSidebar';
import { cn } from '@/utils';
import { ROLES } from '@/utils/constants/roles';
import { currentUser } from '@clerk/nextjs/server';
const DashboardLayout = async ({ children }) => {
    const user = await currentUser();
    const rawRole = user?.unsafeMetadata.role;
    const role = rawRole?.toUpperCase().trim() || ROLES.PASSENGER;
    return (<div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="flex flex-1 relative">
                <div id="home" className={cn('absolute inset-0 h-full bg-grid bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] z-[-1] opacity-50', 'dark:bg-grid dark:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]')}/>
                <AppSidebar role={role} className="sticky top-20 h-[calc(100vh-5rem)] z-10"/>
                <main className="flex-1 relative z-0 p-6">{children}</main>
            </div>
            <Footer />
        </div>);
};
export default DashboardLayout;
