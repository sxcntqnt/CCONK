'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import Knock, { FeedItem, FeedStoreState, NotificationSource } from '@knocklabs/client';
import '@knocklabs/react/dist/index.css';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';
import { Toaster } from './sonner';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast';
import { FeedItemCard } from './FeedItemCard';
import { ROLES, Role } from '@/utils';
import PreferenceCenter from './PreferenceCenter';
import { cn } from '@/utils';

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

type NotificationFeedProps = {
    badgeCountVisible?: boolean;
    userRole: Role;
    externalNotifications?: ExternalNotification[];
};

const NotificationFeed = ({
    badgeCountVisible = true,
    userRole,
    externalNotifications = [],
}: NotificationFeedProps) => {
    const { user } = useUser();
    const [feed, setFeed] = useState<FeedStoreState>({} as FeedStoreState);
    const [isWelcomeToastOpen, setIsWelcomeToastOpen] = useState(false);
    const [isNotificationToastOpen, setIsNotificationToastOpen] = useState(false);
    const [latestNotification, setLatestNotification] = useState<FeedItem | null>(null);

    if (!user) return null;

    const knockClient = new Knock(process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY as string);
    knockClient.authenticate(user.id);
    const knockFeed = knockClient.feeds.initialize(process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID as string, {
        page_size: 20,
        archived: 'include',
    });

    useEffect(() => {
        knockFeed.listenForUpdates();
        const fetchFeed = async () => {
            await knockFeed.fetch();
            const feedState = knockFeed.getState();
            setFeed(feedState);
            // Show welcome toast when feed is loaded
            setIsWelcomeToastOpen(true);
        };
        fetchFeed();

        knockFeed.on('items.received.realtime', ({ items }: { items: FeedItem[] }) => {
            items.forEach((item) => {
                if (item.data && item.data.showToast) {
                    // Store the latest notification and open the toast
                    setLatestNotification(item);
                    setIsNotificationToastOpen(true);
                }
            });
            setFeed(knockFeed.getState());
        });

        knockFeed.on('items.*', () => {
            console.log('calling items.*');
            setFeed(knockFeed.getState());
        });

        return () => {
            knockFeed.teardown();
        };
    }, []);

    const [feedItems, archivedItems] = useMemo(() => {
        // Combine Knock feed items with external notifications
        const knockItems = feed?.items || [];
        const externalFeedItems: FeedItem[] = externalNotifications.map((notif) => ({
            id: notif.id,
            data: { showToast: true },
            inserted_at: notif.sentAt,
            updated_at: notif.sentAt,
            archived_at: null, // Treat external notifications as non-archived by default
            read_at: null,
            seen_at: null,
            clicked_at: null,
            interacted_at: null,
            link_clicked_at: null,
            actors: [],
            activities: [],
            block_ids: [],
            blocks: [],
            tenant: null,
            recipient: { id: user.id },
            __cursor: notif.id,
            source: 'in_app_feed' as unknown as NotificationSource, // Cast to unknown first to satisfy type
            total_activities: 0,
            total_actors: 0,
        }));

        const allItems = [...knockItems, ...externalFeedItems];
        const feedItems = allItems.filter((item) => !item.archived_at);
        const archivedItems = allItems.filter((item) => item.archived_at);
        return [feedItems, archivedItems];
    }, [feed, externalNotifications, user.id]);

    async function markAllAsRead() {
        await knockFeed.markAllAsRead();
        setFeed(knockFeed.getState());
    }

    async function markAllAsArchived() {
        await knockFeed.markAllAsArchived();
        setFeed(knockFeed.getState());
    }

    return (
        <ToastProvider>
            <Tabs defaultValue="inbox" className="w-[600px]">
                <TabsList>
                    <TabsTrigger value="inbox">
                        Inbox{' '}
                        {feed.loading ? null : (
                            <Badge className="ml-2" variant="secondary">
                                {feed?.metadata?.unread_count || 0}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <Separator orientation="vertical" />
                    <Dialog>
                        <DialogTrigger className="mx-6 text-xl">⚙️</DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Notification Preferences</DialogTitle>
                                <DialogDescription>
                                    <PreferenceCenter />
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </TabsList>
                <TabsContent value="inbox">
                    <div className="my-6 flex">
                        <Button variant="outline" onClick={markAllAsRead} className="w-full mr-2">
                            Mark all as read
                        </Button>
                        <Button variant="outline" className="w-full ml-2" onClick={markAllAsArchived}>
                            Archive all
                        </Button>
                    </div>
                    {feedItems?.length > 0 ? (
                        feedItems?.map((item: FeedItem) => {
                            // Find matching external notification for additional data
                            const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                            return (
                                <FeedItemCard
                                    key={item.id}
                                    item={{
                                        ...item,
                                        data: {
                                            ...item.data,
                                            message: externalNotif?.message,
                                            type: externalNotif?.type,
                                            destination: externalNotif?.destination,
                                            driverName: externalNotif?.driverName,
                                        },
                                    }}
                                    knockFeed={knockFeed}
                                    userRole={userRole}
                                />
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center my-12 py-12 bg-slate-50 rounded-md">
                            <Inbox className="w-16 h-16" />
                            <p className="mt-6">You're all caught up</p>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="archived">
                    {archivedItems?.map((item: FeedItem) => {
                        const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                        return (
                            <FeedItemCard
                                key={item.id}
                                item={{
                                    ...item,
                                    data: {
                                        ...item.data,
                                        message: externalNotif?.message,
                                        type: externalNotif?.type,
                                        destination: externalNotif?.destination,
                                        driverName: externalNotif?.driverName,
                                    },
                                }}
                                knockFeed={knockFeed}
                                userRole={userRole}
                            />
                        );
                    })}
                </TabsContent>
                <TabsContent value="all">
                    {[...feedItems, ...archivedItems].map((item: FeedItem) => {
                        const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                        return (
                            <FeedItemCard
                                key={item.id}
                                item={{
                                    ...item,
                                    data: {
                                        ...item.data,
                                        message: externalNotif?.message,
                                        type: externalNotif?.type,
                                        destination: externalNotif?.destination,
                                        driverName: externalNotif?.driverName,
                                    },
                                }}
                                knockFeed={knockFeed}
                                userRole={userRole}
                            />
                        );
                    })}
                </TabsContent>
                <Toaster />
                <ToastViewport />
                <Toast open={isWelcomeToastOpen} onOpenChange={setIsWelcomeToastOpen}>
                    <ToastTitle>Welcome to Notifications</ToastTitle>
                    <ToastDescription>
                        Your notification feed is ready at {new Date().toLocaleString()}
                    </ToastDescription>
                    <ToastClose />
                </Toast>
                {latestNotification && (
                    <Toast open={isNotificationToastOpen} onOpenChange={setIsNotificationToastOpen}>
                        <ToastTitle>
                            📨 New notification at {new Date(latestNotification.inserted_at).toLocaleString()}
                        </ToastTitle>
                        <ToastDescription>Snap! This real-time feed is mind-blowing 🤯</ToastDescription>
                        <ToastClose />
                    </Toast>
                )}
            </Tabs>
        </ToastProvider>
    );
};

export default NotificationFeed;
