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
const button_1 = require("@/components/ui/button");
const navigation_menu_1 = require("@/components/ui/navigation-menu");
const utils_1 = require("@/utils");
const nextjs_1 = require("@clerk/nextjs");
const link_1 = __importDefault(require("next/link"));
const react_1 = __importStar(require("react"));
const max_width_wrapper_1 = __importDefault(require("../global/max-width-wrapper"));
const mobile_navbar_1 = __importDefault(require("./mobile-navbar"));
const animation_container_1 = __importDefault(require("../global/animation-container"));
const ThemeSwitcher_1 = require("@/components/ui/ThemeSwitcher"); // Import ThemeSwitcher
const Navbar = ({ className }) => {
    const { user, signOut } = (0, nextjs_1.useClerk)(); // Access signOut from useClerk
    const [scroll, setScroll] = (0, react_1.useState)(false);
    const handleScroll = () => {
        setScroll(window.scrollY > 8);
    };
    (0, react_1.useEffect)(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (<header className={(0, utils_1.cn)('sticky inset-x-0 top-0 z-[99999] h-20 w-full select-none border-b border-transparent', scroll && 'border-background/80 bg-background/40 backdrop-blur-md', className)}>
            <animation_container_1.default reverse delay={0.1} className="size-full">
                <max_width_wrapper_1.default className="flex items-center justify-between h-full">
                    <div className="flex items-center space-x-12">
                        <link_1.default href="/#home">
                            <span className="font-heading text-lg font-bold !leading-none">SXCNTQNT</span>
                        </link_1.default>

                        <navigation_menu_1.NavigationMenu className="hidden lg:flex">
                            <navigation_menu_1.NavigationMenuList>
                                {utils_1.NAV_LINKS.map((link) => (<navigation_menu_1.NavigationMenuItem key={link.title}>
                                        {link.menu ? (<>
                                                <navigation_menu_1.NavigationMenuTrigger>{link.title}</navigation_menu_1.NavigationMenuTrigger>
                                                <navigation_menu_1.NavigationMenuContent>
                                                    <ul className={(0, utils_1.cn)('grid gap-1 rounded-xl p-4 md:w-[400px] lg:w-[500px]', link.title === 'Features'
                    ? 'lg:grid-cols-[.75fr_1fr]'
                    : 'lg:grid-cols-2')}>
                                                        {link.title === 'Features' && (<li className="relative row-span-4 overflow-hidden rounded-lg pr-2">
                                                                <div className="absolute inset-0 !z-10 h-full w-[calc(100%-10px)] bg-[linear-gradient(to_right,rgb(38,38,38,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(38,38,38,0.5)_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>
                                                                <navigation_menu_1.NavigationMenuLink asChild className="relative z-20">
                                                                    <link_1.default href="/" className="flex h-full w-full select-none flex-col justify-end rounded-lg bg-gradient-to-b from-muted/50 to-muted p-4 no-underline outline-none focus:shadow-md">
                                                                        <h6 className="mb-2 mt-4 text-lg font-medium">
                                                                            All Features
                                                                        </h6>
                                                                        <p className="text-sm leading-tight text-muted-foreground">
                                                                            Manage links, track performance, and more.
                                                                        </p>
                                                                    </link_1.default>
                                                                </navigation_menu_1.NavigationMenuLink>
                                                            </li>)}
                                                        {link.menu.map((menuItem) => (<ListItem key={menuItem.title} title={menuItem.title} href={menuItem.href} icon={menuItem.icon} tagline={menuItem.tagline}/>))}
                                                    </ul>
                                                </navigation_menu_1.NavigationMenuContent>
                                            </>) : (<navigation_menu_1.NavigationMenuLink asChild>
                                                <link_1.default href={link.href} passHref className={(0, navigation_menu_1.navigationMenuTriggerStyle)()}>
                                                    {link.title}
                                                </link_1.default>
                                            </navigation_menu_1.NavigationMenuLink>)}
                                    </navigation_menu_1.NavigationMenuItem>))}
                            </navigation_menu_1.NavigationMenuList>
                        </navigation_menu_1.NavigationMenu>
                    </div>

                    <div className="hidden items-center lg:flex space-x-4">
                        {user ? (<div className="flex items-center space-x-4">
                                <link_1.default href="/profile">
                                    <button_1.Button variant="outline">Profile</button_1.Button>
                                </link_1.default>
                                <button_1.Button variant="outline" onClick={() => signOut({ redirectUrl: '/' })} // Sign out and redirect to homepage
        >
                                    Logout
                                </button_1.Button>
                            </div>) : (<link_1.default href="/auth/Sign-in">
                                <button_1.Button variant="outline">Login</button_1.Button>
                            </link_1.default>)}
                        <ThemeSwitcher_1.ThemeSwitcher /> {/* Add ThemeSwitcher to the rightmost side */}
                    </div>

                    <mobile_navbar_1.default />
                </max_width_wrapper_1.default>
            </animation_container_1.default>
        </header>);
};
const ListItem = ({ title, href, icon: IconComponent, tagline }) => (<li>
        <navigation_menu_1.NavigationMenuLink asChild>
            <link_1.default href={href} passHref className="flex items-center space-x-2 p-2 hover:bg-muted">
                {IconComponent && <IconComponent className="w-5 h-5"/>}
                <span>{title}</span>
            </link_1.default>
        </navigation_menu_1.NavigationMenuLink>
        {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
    </li>);
exports.default = Navbar;
