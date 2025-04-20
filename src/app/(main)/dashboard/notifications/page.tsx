'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MagicBadge from '@/components/ui/magic-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { ROLES, Role } from '@/utils/constants/roles';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';
import NotificationFeed from '@/components/ui/NotificationFeed';

// Form schema for notification submission
const formSchema = z.object({
    destination: z.string().min(2, 'Destination must be at least 2 characters').max(100),
});

// Type for merged notifications
type MergedNotification = {
    id: string;
    type: string;
    message: string;
    sentAt: string;
    tripId?: string;
    busId?: string;
    destination?: string;
    driverName?: string;
    source: 'knock' | 'prisma';
};

export default function NotificationsPage() {
    const { user } = useUser();

    // Redirect if not authenticated
    if (!user) {
        redirect('/auth/sign-in');
    }

    // Get role from unsafeMetadata
    const role = user.unsafeMetadata.role as Role | undefined;

    // Redirect if role is invalid or missing
    if (!role || !Object.values(ROLES).includes(role)) {
        redirect('/');
    }

    // Form setup for Drivers and Owners
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { destination: '' },
    });

    // Submit handler for notifyDriverArrival
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            const formData = new FormData();
            formData.append('destination', data.destination);
            await notifyDriverArrival(formData);
            form.reset();
        } catch (error) {
            form.setError('root', {
                message: error instanceof Error ? error.message : 'Failed to send notification',
            });
        }
    };

    // Fetch Prisma notifications
    const {
        data: prismaNotifications = [],
        isLoading,
        error: prismaError,
    } = useQuery({
        queryKey: ['prisma-notifications', user.id],
        queryFn: async () => {
            const response = await fetch(`/api/notifications?userId=${user.id}`);
            if (!response.ok) throw new Error('Failed to fetch Prisma notifications');
            return response.json();
        },
        enabled: !!user.id,
    });

    return (
        <div
            className={cn(
                'container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8',
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min',
            )}
        >
            <div className="col-span-12 lg:col-span-8">
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                {(role === ROLES.DRIVER || role === ROLES.OWNER) && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Send Arrival Notification</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="destination"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Destination</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter destination" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'Sending...' : 'Notify Arrival'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {/* Use the NotificationFeed component for Knock notifications */}
                <div className="flex justify-end mb-4">
                    <NotificationFeed showNotificationCount={true} customRenderer={true} userRole={role as Role} />
                </div>

                {/* Prisma notifications display */}
                {isLoading ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">Loading notifications...</p>
                        </CardContent>
                    </Card>
                ) : prismaError ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-destructive">Failed to load notifications: {prismaError.message}</p>
                        </CardContent>
                    </Card>
                ) : prismaNotifications.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">No notifications yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {prismaNotifications.map((notif: any) => {
                            const mappedNotif: MergedNotification = {
                                id: `prisma-${notif.id}`,
                                type: notif.type,
                                message: notif.message,
                                sentAt: notif.sentAt,
                                tripId: notif.tripId?.toString(),
                                source: 'prisma',
                            };
                            return (
                                <Card
                                    key={mappedNotif.id}
                                    className={cn(
                                        'transition-all duration-200',
                                        role === ROLES.PASSENGER &&
                                            'border-blue-500 bg-gradient-to-r from-blue-500/10 to-teal-500/10 hover:shadow-blue-500/20',
                                        role === ROLES.DRIVER &&
                                            'border-purple-500 bg-gradient-to-r from-purple-500/10 to-red-500/10 hover:shadow-purple-500/20',
                                        role === ROLES.OWNER &&
                                            'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/20',
                                    )}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {mappedNotif.type === 'DRIVER_ARRIVAL'
                                                ? 'Driver Arrival'
                                                : mappedNotif.type || 'Notification'}
                                        </CardTitle>
                                        <MagicBadge variant="outline">
                                            {mappedNotif.sentAt
                                                ? formatDistanceToNow(new Date(mappedNotif.sentAt), {
                                                      addSuffix: true,
                                                  })
                                                : 'Unknown time'}
                                        </MagicBadge>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{mappedNotif.message}</p>
                                        {mappedNotif.tripId && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Trip ID: {mappedNotif.tripId}
                                            </p>
                                        )}
                                        {role === ROLES.PASSENGER && mappedNotif.tripId && (
                                            <Button variant="outline" size="sm" className="mt-2" asChild>
                                                <Link href={`/dashboard/trips/${mappedNotif.tripId}`}>View Trip</Link>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
