'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Add Popover components
import { cn, NAV_LINKS } from '@/utils';
import { useAuth } from '@clerk/nextjs';
import { Bell, LucideIcon, Menu, X } from 'lucide-react'; // Add Bell icon
import Link from 'next/link';
import React, { useState } from 'react';

const MobileNavbar = () => {
    const { isSignedIn } = useAuth();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <div className="flex items-center justify-end lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="ghost">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-screen">
                    <SheetClose
                        asChild
                        className="absolute right-5 top-3 z-20 flex items-center justify-center bg-background"
                    >
                        <Button size="icon" variant="ghost" className="text-neutral-600">
                            <X className="h-5 w-5" />
                        </Button>
                    </SheetClose>
                    <div className="mt-10 flex w-full flex-col items-start py-2">
                        <div className="flex w-full items-center justify-evenly space-x-2">
                            {isSignedIn ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className={cn(
                                                buttonVariants({ variant: 'outline', size: 'sm' }),
                                                'relative w-full max-w-[120px]',
                                            )}
                                        >
                                            <Bell className="h-5 w-5" />
                                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4">
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
                            ) : (
                                <>
                                    <Link
                                        href="/auth/sign-in"
                                        className={buttonVariants({
                                            variant: 'outline',
                                            className: 'w-full',
                                        })}
                                    >
                                        Sign In
                                    </Link>
                                    <Link href="/auth/sign-up" className={buttonVariants({ className: 'w-full' })}>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                        <ul className="mt-6 flex w-full flex-col items-start">
                            <Accordion type="single" collapsible className="!w-full">
                                {NAV_LINKS.map((link) => (
                                    <AccordionItem key={link.title} value={link.title} className="last:border-none">
                                        {link.menu ? (
                                            <>
                                                <AccordionTrigger>{link.title}</AccordionTrigger>
                                                <AccordionContent>
                                                    <ul onClick={handleClose} className={cn('w-full')}>
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
                                                </AccordionContent>
                                            </>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                onClick={handleClose}
                                                className="flex w-full items-center py-4 font-medium text-muted-foreground hover:text-foreground"
                                            >
                                                <span>{link.title}</span>
                                            </Link>
                                        )}
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </ul>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

const ListItem = React.forwardRef<
    React.ElementRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & { title: string; icon: LucideIcon }
>(({ className, title, href, icon: Icon, children, ...props }, ref) => {
    return (
        <li>
            <Link
                href={href!}
                ref={ref}
                className={cn(
                    'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                    className,
                )}
                {...props}
            >
                <div className="flex items-center space-x-2 text-foreground">
                    <Icon className="h-4 w-4" />
                    <h6 className="text-sm !leading-none">{title}</h6>
                </div>
                <p title={children! as string} className="line-clamp-1 text-sm leading-snug text-muted-foreground">
                    {children}
                </p>
            </Link>
        </li>
    );
});
ListItem.displayName = 'ListItem';

export default MobileNavbar;
