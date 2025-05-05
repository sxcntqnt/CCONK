"use strict";
// src/components/navigation/appSidebar.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const sidebar_1 = require("@/components/ui/sidebar");
const tooltip_1 = require("@/components/ui/tooltip");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/utils");
const config_1 = require("@/components/config");
const animation_container_1 = __importDefault(require("../global/animation-container"));
const AppSidebar = ({ role, className }) => {
    const [isCollapsed, setIsCollapsed] = (0, react_1.useState)(false);
    const pathname = (0, navigation_1.usePathname)();
    const itemsByRole = (0, config_1.getNavItemsByRole)(role);
    const mainItems = itemsByRole.filter((item) => item.position === 'main');
    const bottomItems = itemsByRole.filter((item) => item.position === 'bottom');
    const renderNavItem = (item, delay) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        return (<sidebar_1.SidebarMenuItem key={item.path}>
                <animation_container_1.default delay={delay} className="w-full">
                    <tooltip_1.Tooltip>
                        <tooltip_1.TooltipTrigger asChild>
                            <sidebar_1.SidebarMenuButton asChild className={(0, utils_1.cn)('w-full font-inter text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 ease-in-out', isActive && 'bg-sidebar-primary text-sidebar-primary-foreground', isCollapsed && 'justify-center')}>
                                <link_1.default href={item.path}>
                                    <Icon className="h-5 w-5"/>
                                    <span className={(0, utils_1.cn)('text-sm font-medium', isCollapsed && 'hidden')}>
                                        {item.name}
                                    </span>
                                </link_1.default>
                            </sidebar_1.SidebarMenuButton>
                        </tooltip_1.TooltipTrigger>
                        {isCollapsed && (<tooltip_1.TooltipContent side="right" className="bg-popover text-sidebar-foreground border-sidebar-border/40 backdrop-blur-md font-inter text-sm">
                                {item.name}
                            </tooltip_1.TooltipContent>)}
                    </tooltip_1.Tooltip>
                </animation_container_1.default>
            </sidebar_1.SidebarMenuItem>);
    };
    return (<tooltip_1.TooltipProvider>
            <sidebar_1.Sidebar className={(0, utils_1.cn)('bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out relative shrink-0 font-inter', isCollapsed ? 'w-16' : 'w-64', className)}>
                <sidebar_1.SidebarContent className="flex flex-col h-full">
                    {/* Main Items */}
                    <sidebar_1.SidebarGroup className="flex-1 pt-4">
                        <sidebar_1.SidebarMenu>
                            {mainItems.map((item, index) => renderNavItem(item, 0.1 + index * 0.05))}
                        </sidebar_1.SidebarMenu>
                    </sidebar_1.SidebarGroup>

                    {/* Bottom Items (Logout) */}
                    <sidebar_1.SidebarGroup className="mt-auto pb-4">
                        <sidebar_1.SidebarMenu>
                            {bottomItems.map((item, index) => renderNavItem(item, 0.1 + index * 0.05))}
                        </sidebar_1.SidebarMenu>
                    </sidebar_1.SidebarGroup>
                </sidebar_1.SidebarContent>

                <animation_container_1.default delay={0.6} className={(0, utils_1.cn)('absolute top-1/2 transform -translate-y-1/2 z-20', // Removed animate-blink
        isCollapsed ? 'right-[-1rem]' : 'right-[-1.5rem]')}>
                    <button onClick={() => setIsCollapsed((prev) => !prev)} className={(0, utils_1.cn)('flex items-center justify-center rounded-full bg-sidebar/80 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground border border-sidebar-border/40 backdrop-blur-md transition-all duration-300 ease-in-out shadow-md', isCollapsed ? 'w-8 h-8' : 'w-6 h-6')}>
                        {isCollapsed ? <lucide_react_1.ChevronRight className="h-4 w-4"/> : <lucide_react_1.ChevronLeft className="h-4 w-4"/>}
                    </button>
                </animation_container_1.default>
            </sidebar_1.Sidebar>
        </tooltip_1.TooltipProvider>);
};
exports.default = AppSidebar;
