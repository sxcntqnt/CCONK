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
import { getNavItemsByRole, NavItem } from '@/components/config/nav-items';

type AppSidebarProps = {
    role: 'OWNER' | 'PASSENGER' | 'DRIVER';
};

export function AppSidebar({ role }: AppSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const itemsByRole = getNavItemsByRole(role); // ✅ use uppercase role
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
                                'w-full',
                                isActive && 'bg-accent text-accent-foreground',
                                isCollapsed && 'justify-center',
                            )}
                        >
                            <Link href={isCollapsed ? '#' : item.path}>
                                <Icon className="h-5 w-5" />
                                <span className={cn(isCollapsed && 'hidden')}>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
                </Tooltip>
            </SidebarMenuItem>
        );
    };

    return (
        <TooltipProvider>
            <Sidebar collapsible="icon" className="h-full overflow-y-auto">
                <SidebarHeader className="p-4 sticky top-0 bg-background z-10">
                    <h2 className={cn('text-xl font-bold', isCollapsed && 'hidden')}>Fleet Management</h2>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="flex-1">
                        <SidebarMenu>{mainItems.map(renderNavItem)}</SidebarMenu>
                    </SidebarGroup>

                    <div className="py-2 px-4">
                        <SidebarMenuButton
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-full justify-center"
                        >
                            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </SidebarMenuButton>
                    </div>
                </SidebarContent>

                <SidebarFooter className="sticky bottom-0 bg-background p-4 border-t">
                    <SidebarMenu>{bottomItems.map(renderNavItem)}</SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </TooltipProvider>
    );
}
