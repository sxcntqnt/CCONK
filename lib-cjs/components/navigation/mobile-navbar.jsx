"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accordion_1 = require("@/components/ui/accordion");
const button_1 = require("@/components/ui/button");
const sheet_1 = require("@/components/ui/sheet");
const popover_1 = require("@/components/ui/popover");
const utils_1 = require("@/utils");
const nextjs_1 = require("@clerk/nextjs");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const react_1 = __importStar(require("react"));
const ThemeSwitcher_1 = require("@/components/ui/ThemeSwitcher");
const MobileNavbar = () => {
    const { isSignedIn, signOut } = (0, nextjs_1.useClerk)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const handleClose = () => {
        setIsOpen(false);
    };
    return (<div className="flex items-center justify-end lg:hidden">
            <sheet_1.Sheet open={isOpen} onOpenChange={setIsOpen}>
                <sheet_1.SheetTrigger asChild>
                    <button_1.Button size="icon" variant="ghost">
                        <lucide_react_1.Menu className="h-5 w-5"/>
                    </button_1.Button>
                </sheet_1.SheetTrigger>
                <sheet_1.SheetContent className="w-screen">
                    <sheet_1.SheetClose asChild className="absolute right-5 top-3 z-20 flex items-center justify-center bg-background">
                        <button_1.Button size="icon" variant="ghost" className="text-neutral-600">
                            <lucide_react_1.X className="h-5 w-5"/>
                        </button_1.Button>
                    </sheet_1.SheetClose>
                    <div className="mt-10 flex w-full flex-col items-start py-2">
                        <div className="flex w-full items-center justify-evenly space-x-2">
                            {isSignedIn ? (<>
                                    <link_1.default href="/profile" className={(0, utils_1.cn)((0, button_1.buttonVariants)({ variant: 'outline', size: 'sm' }), 'w-full max-w-[120px]')}>
                                        Profile
                                    </link_1.default>
                                    <popover_1.Popover>
                                        <popover_1.PopoverTrigger asChild>
                                            <button_1.Button variant="outline" size="icon" className={(0, utils_1.cn)((0, button_1.buttonVariants)({ variant: 'outline', size: 'sm' }), 'relative w-full max-w-[120px]')}>
                                                <lucide_react_1.Bell className="h-5 w-5"/>
                                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"/>
                                            </button_1.Button>
                                        </popover_1.PopoverTrigger>
                                        <popover_1.PopoverContent className="w-80 p-4">
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-medium">Notifications</h4>
                                                <div className="space-y-2">
                                                    <div className="rounded-md border p-2">
                                                        <p className="text-sm">Trip #123 assigned to you.</p>
                                                        <p className="text-xs text-muted-foreground">5 mins ago</p>
                                                    </div>
                                                    <div className="rounded-md border p-2">
                                                        <p className="text-sm">Payment received: $50.</p>
                                                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                                                    </div>
                                                    <div className="rounded-md border p-2">
                                                        <p className="text-sm">New passenger booked.</p>
                                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                                    </div>
                                                </div>
                                                <link_1.default href="/dashboard/notifications" className={(0, utils_1.cn)((0, button_1.buttonVariants)({ variant: 'outline', size: 'sm' }), 'w-full')}>
                                                    View All Notifications
                                                </link_1.default>
                                            </div>
                                        </popover_1.PopoverContent>
                                    </popover_1.Popover>
                                    <button_1.Button variant="outline" className={(0, utils_1.cn)((0, button_1.buttonVariants)({ variant: 'outline', size: 'sm' }), 'w-full max-w-[120px]')} onClick={() => {
                signOut({ redirectUrl: '/' });
                handleClose();
            }}>
                                        Logout
                                    </button_1.Button>
                                </>) : (<>
                                    <link_1.default href="/auth/sign-in" className={(0, button_1.buttonVariants)({
                variant: 'outline',
                className: 'w-full',
            })}>
                                        Sign In
                                    </link_1.default>
                                    <link_1.default href="/auth/sign-up" className={(0, button_1.buttonVariants)({ className: 'w-full' })}>
                                        Sign Up
                                    </link_1.default>
                                </>)}
                        </div>
                        <ul className="mt-6 flex w-full flex-col items-start">
                            <accordion_1.Accordion type="single" collapsible className="!w-full">
                                {utils_1.NAV_LINKS.map((link) => (<accordion_1.AccordionItem key={link.title} value={link.title} className="last:border-none">
                                        {link.menu ? (<>
                                                <accordion_1.AccordionTrigger>{link.title}</accordion_1.AccordionTrigger>
                                                <accordion_1.AccordionContent>
                                                    <ul onClick={handleClose} className={(0, utils_1.cn)('w-full')}>
                                                        {link.menu.map((menuItem) => (<ListItem key={menuItem.title} title={menuItem.title} href={menuItem.href} icon={menuItem.icon}>
                                                                {menuItem.tagline}
                                                            </ListItem>))}
                                                    </ul>
                                                </accordion_1.AccordionContent>
                                            </>) : (<link_1.default href={link.href} onClick={handleClose} className="flex w-full items-center py-4 font-medium text-muted-foreground hover:text-foreground" legacyBehavior>
                                                <span>{link.title}</span>
                                            </link_1.default>)}
                                    </accordion_1.AccordionItem>))}
                            </accordion_1.Accordion>
                        </ul>
                        {/* Add ThemeSwitcher below navigation links */}
                        <div className="mt-6 w-full">
                            <ThemeSwitcher_1.ThemeSwitcher onThemeChange={handleClose}/>
                        </div>
                    </div>
                </sheet_1.SheetContent>
            </sheet_1.Sheet>
        </div>);
};
const ListItem = react_1.default.forwardRef(({ className, title, href, icon: Icon, children, ...props }, ref) => {
    return (<li>
            <link_1.default href={href} ref={ref} className={(0, utils_1.cn)('block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground', className)} {...props} legacyBehavior>
                <div className="flex items-center space-x-2 text-foreground">
                    <Icon className="h-4 w-4"/>
                    <h6 className="text-sm !leading-none">{title}</h6>
                </div>
                <p title={children} className="line-clamp-1 text-sm leading-snug text-muted-foreground">
                    {children}
                </p>
            </link_1.default>
        </li>);
});
ListItem.displayName = 'ListItem';
exports.default = MobileNavbar;
