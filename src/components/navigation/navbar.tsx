// src/components/navigation/navbar.tsx
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, NAV_LINKS } from '@/utils';
import { useClerk } from '@clerk/nextjs';
import { Bell, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import MaxWidthWrapper from '../global/max-width-wrapper';
import MobileNavbar from './mobile-navbar';
import AnimationContainer from '../global/animation-container';

// Define MenuItem type based on NAV_LINKS.menu structure
interface MenuItem {
    title: string;
    href: string;
    icon?: React.ReactNode; // Supports LucideIcon or other JSX elements
    tagline?: string;
}

const Navbar = () => {
    const { user } = useClerk();
    const [scroll, setScroll] = useState(false);

    const handleScroll = () => {
        setScroll(window.scrollY > 8);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky inset-x-0 top-0 z-[99999] h-14 w-full select-none border-b border-transparent',
                scroll && 'border-background/80 bg-background/40 backdrop-blur-md',
            )}
        >
            <AnimationContainer reverse delay={0.1} className="size-full">
                <MaxWidthWrapper className="flex items-center justify-between">
                    <div className="flex items-center space-x-12">
                        <Link href="/#home">
                            <span className="font-heading text-lg font-bold !leading-none">SXCNTQNT</span>
                        </Link>

                        <NavigationMenu className="hidden lg:flex">
                            <NavigationMenuList>
                                {NAV_LINKS.map((link) => (
                                    <NavigationMenuItem key={link.title}>
                                        {link.menu ? (
                                            <>
                                                <NavigationMenuTrigger>{link.title}</NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <ul
                                                        className={cn(
                                                            'grid gap-1 rounded-xl p-4 md:w-[400px] lg:w-[500px]',
                                                            link.title === 'Features'
                                                                ? 'lg:grid-cols-[.75fr_1fr]'
                                                                : 'lg:grid-cols-2',
                                                        )}
                                                    >
                                                        {link.title === 'Features' && (
                                                            <li className="relative row-span-4 overflow-hidden rounded-lg pr-2">
                                                                <div className="absolute inset-0 !z-10 h-full w-[calc(100%-10px)] bg-[linear-gradient(to_right,rgb(38,38,38,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(38,38,38,0.5)_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>
                                                                <NavigationMenuLink asChild className="relative z-20">
                                                                    <Link
                                                                        href="/"
                                                                        className="flex h-full w-full select-none flex-col justify-end rounded-lg bg-gradient-to-b from-muted/50 to-muted p-4 no-underline outline-none focus:shadow-md"
                                                                    >
                                                                        <h6 className="mb-2 mt-4 text-lg font-medium">
                                                                            All Features
                                                                        </h6>
                                                                        <p className="text-sm leading-tight text-muted-foreground">
                                                                            Manage links, track performance, and more.
                                                                        </p>
                                                                    </Link>
                                                                </NavigationMenuLink>
                                                            </li>
                                                        )}
                                                        {link.menu.map((menuItem) => (
                                                            <ListItem
                                                                key={menuItem.title}
                                                                title={menuItem.title}
                                                                href={menuItem.href}
                                                                icon={menuItem.icon}
                                                                tagline={menuItem.tagline}
                                                            />
                                                        ))}
                                                    </ul>
                                                </NavigationMenuContent>
                                            </>
                                        ) : (
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    href={link.href}
                                                    passHref
                                                    className={navigationMenuTriggerStyle()}
                                                >
                                                    {link.title}
                                                </Link>
                                            </NavigationMenuLink>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="hidden items-center lg:flex">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link href="/profile">
                                    <Button variant="outline">Profile</Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        /* handle logout */
                                    }}
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <Link href="/auth/sign-in">
                                <Button variant="outline">Login</Button>
                            </Link>
                        )}
                    </div>

                    <MobileNavbar />
                </MaxWidthWrapper>
            </AnimationContainer>
        </header>
    );
};

// Define ListItem component with typed props
const ListItem = ({ title, href, icon, tagline }: MenuItem) => (
    <li>
        <NavigationMenuLink asChild>
            <Link href={href} passHref className="flex items-center space-x-2 p-2 hover:bg-muted">
                {icon && <span className="text-lg">{icon}</span>}
                <span>{title}</span>
            </Link>
        </NavigationMenuLink>
        {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
    </li>
);

export default Navbar;
