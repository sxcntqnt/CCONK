'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils';
import { ROLES, Role } from '@/utils/constants/roles';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { notifyDriverArrival } from '@/actions/notify-driver-arrival';
import { notifyDriverInTransit, notifyDriverOffline } from '@/actions/notify-driver-status';
import NotificationFeed from '@/components/ui/NotificationFeed';
import { useNotificationStore, useDriverStore, useTripStore, useBusStore } from '@/store';
import { Notification, Trip, Bus, Driver } from '@/utils/constants/types';

// Form schema for notification submission
const formSchema = z
    .object({
        notificationType: z.enum(['Arrival', 'In-Transit', 'Offline']),
        destination: z.string().min(2, 'Destination must be at least 2 characters').max(100).optional(),
        message: z.string().max(500).optional(),
    })
    .refine(
        (data) => {
            if (data.notificationType === 'Arrival') {
                return !!data.destination;
            }
            return true;
        },
        {
            message: 'Destination is required for Arrival notifications',
            path: ['destination'],
        },
    );

type ExternalNotification = {
    id: string;
    type: string;
    message: string;
    sentAt: string;
    tripId?: string;
    busId?: string;
    destination?: string;
    driverName?: string;
    source: 'prisma';
};

export default function NotificationsPage() {
    const { user } = useUser();
    const { notifications, setNotifications } = useNotificationStore();
    const { drivers } = useDriverStore();
    const { trips } = useTripStore();
    const { buses } = useBusStore();

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
        defaultValues: {
            notificationType: 'Arrival',
            destination: '',
            message: '',
        },
    });

    // Submit handler for notifications
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            const formData = new FormData();
            if (data.notificationType === 'Arrival') {
                formData.append('destination', data.destination || '');
            } else {
                formData.append('message', data.message || '');
            }

            let newNotification: Notification;
            switch (data.notificationType) {
                case 'Arrival':
                    newNotification = await notifyDriverArrival(formData);
                    break;
                case 'In-Transit':
                    newNotification = await notifyDriverInTransit(formData);
                    break;
                case 'Offline':
                    newNotification = await notifyDriverOffline(formData);
                    break;
                default:
                    throw new Error('Invalid notification type');
            }

            // Update store with new notification
            setNotifications([...notifications, newNotification]);
            form.reset({ notificationType: 'Arrival', destination: '', message: '' });
        } catch (error) {
            form.setError('root', {
                message: error instanceof Error ? error.message : 'Failed to send notification',
            });
        }
    };

    // Map store notifications to ExternalNotification format
    const externalNotifications: ExternalNotification[] = notifications.map((notif: Notification) => {
        // Fetch driverName from drivers store if driverId exists
        const driver = notif.driverId ? drivers.find((d: Driver) => d.id === notif.driverId) : null;
        const driverName = driver ? `${driver.firstName} ${driver.lastName}` : undefined;

        // Fetch trip and bus data if tripId exists
        const trip = notif.tripId ? trips.find((t: Trip) => t.id === notif.tripId) : null;
        const bus = trip?.busId ? buses.find((b: Bus) => b.id === trip.busId) : null;

        return {
            id: `prisma-${notif.id}`,
            type: notif.type,
            message: notif.message,
            sentAt: (notif.sentAt || notif.createdAt).toISOString(), // Ensure sentAt is a string
            tripId: notif.tripId?.toString(),
            busId: bus?.id.toString(),
            destination: trip
                ? trip.arrivalCity
                : notif.type === 'DRIVER_ARRIVAL'
                  ? notif.subject?.replace('Driver Arrival at ', '')
                  : undefined,
            driverName,
            source: 'prisma',
        };
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
                            <CardTitle>Send Notification</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="notificationType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notification Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select notification type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Arrival">Arrival</SelectItem>
                                                        <SelectItem value="In-Transit">In-Transit</SelectItem>
                                                        <SelectItem value="Offline">Offline</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch('notificationType') === 'Arrival' && (
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
                                    )}
                                    {form.watch('notificationType') !== 'Arrival' && (
                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Message (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter custom message" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'Sending...' : 'Send Notification'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {/* Display NotificationFeed with merged notifications */}
                <NotificationFeed
                    badgeCountVisible={true}
                    userRole={role}
                    externalNotifications={externalNotifications}
                />
            </div>
        </div>
    );
}
