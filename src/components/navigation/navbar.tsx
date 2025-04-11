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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Add Popover components
import { cn, NAV_LINKS } from '@/utils';
import { useClerk } from '@clerk/nextjs';
import { Bell, LucideIcon, ZapIcon } from 'lucide-react'; // Add Bell icon
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import MaxWidthWrapper from '../global/max-width-wrapper';
import MobileNavbar from './mobile-navbar';
import AnimationContainer from '../global/animation-container';

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
                                                            >
                                                                {menuItem.tagline}
                                                            </ListItem>
                                                        ))}
                                                    </ul>
                                                </NavigationMenuContent>
                                            </>
                                        ) : (
                                            <Link href={link.href} passHref>
                                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                    {link.title}
                                                </NavigationMenuLink>
                                            </Link>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="hidden items-center lg:flex">
                        {user ? (
                            <div className="flex items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), 'relative')}
                                        >
                                            <Bell className="h-5 w-5" />
                                            {/* Optional: Notification badge */}
                                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium">Notifications</h4>
                                            {/* Placeholder notifications */}
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
                                            <Link
                                                href="/dashboard/notifications"
                                                className={cn(
                                                    buttonVariants({ variant: 'outline', size: 'sm' }),
                                                    'w-full',
                                                )}
                                            >
                                                View All Notifications
                                            </Link>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ) : (
                            <div className="flex items-center gap-x-4">
                                <Link href="/auth/sign-in" className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
                                    Sign In
                                </Link>
                                <Link href="/auth/sign-up" className={buttonVariants({ size: 'sm' })}>
                                    Get Started
                                    <ZapIcon className="ml-1.5 size-3.5 fill-orange-500 text-orange-500" />
                                </Link>
                            </div>
                        )}
                    </div>

                    <MobileNavbar />
                </MaxWidthWrapper>
            </AnimationContainer>
        </header>
    );
};

const ListItem = React.forwardRef<
    React.ElementRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & { title: string; icon: LucideIcon }
>(({ className, title, href, icon: Icon, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href!}
                    ref={ref}
                    className={cn(
                        'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-100 ease-out hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                        className,
                    )}
                    {...props}
                >
                    <div className="flex items-center space-x-2 text-neutral-300">
                        <Icon className="h-4 w-4" />
                        <h6 className="text-sm font-medium !leading-none">{title}</h6>
                    </div>
                    <p title={children! as string} className="line-clamp-1 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = 'ListItem';

export default Navbar;
