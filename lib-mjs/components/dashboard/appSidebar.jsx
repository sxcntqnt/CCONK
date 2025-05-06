// src/components/navigation/appSidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { getNavItemsByRole } from '@/components/config';
import AnimationContainer from '../global/animation-container';
const AppSidebar = ({ role, className }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const itemsByRole = getNavItemsByRole(role);
    const mainItems = itemsByRole.filter((item) => item.position === 'main');
    const bottomItems = itemsByRole.filter((item) => item.position === 'bottom');
    const renderNavItem = (item, delay) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (<SidebarMenuItem key={item.path}>
                <AnimationContainer delay={delay} className="w-full">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className={cn('w-full font-inter text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out', isActive && 'bg-sidebar-primary text-sidebar-primary-foreground', isCollapsed && 'justify-center')}>
                                <Link href={item.path}>
                                    <Icon className="h-5 w-5"/>
                                    <span className={cn('text-sm font-medium', isCollapsed && 'hidden')}>
                                        {item.name}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (<TooltipContent side="right" className="bg-popover text-sidebar-foreground border-sidebar-border/40 backdrop-blur-md font-inter text-sm">
                                {item.name}
                            </TooltipContent>)}
                    </Tooltip>
                </AnimationContainer>
            </SidebarMenuItem>);
    };
    return (<TooltipProvider>
            <Sidebar className={cn('bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out relative shrink-0 font-inter', isCollapsed ? 'w-16' : 'w-64', className)}>
                <SidebarContent className="flex flex-col h-full">
                    {/* Main Items */}
                    <SidebarGroup className="flex-1 pt-4">
                        <SidebarMenu>
                            {mainItems.map((item, index) => renderNavItem(item, 0.1 + index * 0.05))}
                        </SidebarMenu>
                    </SidebarGroup>

                    {/* Bottom Items (Logout) */}
                    <SidebarGroup className="mt-auto pb-4">
                        <SidebarMenu>
                            {bottomItems.map((item, index) => renderNavItem(item, 0.1 + index * 0.05))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                <AnimationContainer delay={0.6} className={cn('absolute top-1/2 transform -translate-y-1/2 z-20', // Removed animate-blink
        isCollapsed ? 'right-[-1rem]' : 'right-[-1.5rem]')}>
                    <button onClick={() => setIsCollapsed((prev) => !prev)} className={cn('flex items-center justify-center rounded-full bg-sidebar/80 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground border border-sidebar-border/40 backdrop-blur-md transition-all duration-300 ease-in-out shadow-md', isCollapsed ? 'w-8 h-8' : 'w-6 h-6')}>
                        {isCollapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4"/>}
                    </button>
                </AnimationContainer>
            </Sidebar>
        </TooltipProvider>);
};
export default AppSidebar;
