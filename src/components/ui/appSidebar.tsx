// src/components/ui/appSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { getNavItemsByRole, NavItem } from '@/components/config';
import { AnimationContainer } from '@/components';
import { Separator } from '@/components/ui/separator';

type AppSidebarProps = {
    role: 'OWNER' | 'PASSENGER' | 'DRIVER';
};

export function AppSidebar({ role }: AppSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const itemsByRole = getNavItemsByRole(role);
    const mainItems = itemsByRole.filter((item) => item.position === 'main');
    const bottomItems = itemsByRole.filter((item) => item.position === 'bottom');

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;

        return (
            <SidebarMenuItem key={item.path}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SidebarMenuButton
                            asChild
                            className={cn(
                                'w-full text-white hover:bg-gray-800 transition-colors',
                                isActive && 'bg-gradient-to-r from-green-500 to-green-600 text-white',
                                isCollapsed && 'justify-center',
                            )}
                        >
                            <Link href={isCollapsed ? '#' : item.path}>
                                <Icon className="h-5 w-5" />
                                <span className={cn(isCollapsed && 'hidden')}>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" className="bg-gray-800 text-white border-gray-700">
                            {item.name}
                        </TooltipContent>
                    )}
                </Tooltip>
            </SidebarMenuItem>
        );
    };

    return (
        <TooltipProvider>
            <Sidebar
                collapsible="icon"
                className="h-full bg-gray-900 text-white border-r border-gray-800 shadow-lg overflow-y-auto"
            >
                <SidebarHeader className="p-4 sticky top-0 bg-gray-900 z-10">
                    <AnimationContainer>
                        <h2 className={cn('text-2xl font-bold text-white', isCollapsed && 'hidden')}>
                            Fleet Management
                        </h2>
                    </AnimationContainer>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="flex-1">
                        <SidebarMenu>{mainItems.map(renderNavItem)}</SidebarMenu>
                    </SidebarGroup>

                    <div className="py-2 px-4">
                        <Separator className="my-2 bg-gray-700" />
                        <SidebarMenuButton
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-full justify-center text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </SidebarMenuButton>
                    </div>
                </SidebarContent>

                <SidebarFooter className="sticky bottom-0 bg-gray-900 p-4 border-t border-gray-800">
                    <SidebarMenu>{bottomItems.map(renderNavItem)}</SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </TooltipProvider>
    );
}
