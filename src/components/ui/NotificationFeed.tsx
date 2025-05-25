'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import Knock, { FeedItem, FeedStoreState, NotificationSource } from '@knocklabs/client';
import { motion } from 'motion/react';
import { toast } from 'sonner';
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
import { Toaster } from '@/components/ui/sonner';
import { FeedItemCard } from '@/components/ui/FeedItemCard';
import { ROLES, Role } from '@/utils';
import PreferenceCenter from '@/components/ui/PreferenceCenter';
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

    if (!user) return null;

    // Initialize Knock client and feed once
    const knockClient = useMemo(() => {
        const client = new Knock(process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY as string);
        client.authenticate(user.id);
        return client;
    }, [user.id]);

    const knockFeed = useMemo(() => {
        return knockClient.feeds.initialize(process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID as string, {
            page_size: 20,
            archived: 'include',
        });
    }, [knockClient]);

    useEffect(() => {
        let isConnected = false;

        const fetchFeed = async () => {
            await knockFeed.fetch();
            const feedState = knockFeed.getState();
            setFeed(feedState);
            toast.success('Welcome to Notifications', {
                description: `Your notification feed is ready at ${new Date().toLocaleString()}`,
                className: 'bg-gray-900 text-blue-200 border-gray-700 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
            });
        };

        const handleRealtimeItems = ({ items }: { items: FeedItem[] }) => {
            items.forEach((item) => {
                if (item.data && item.data.showToast) {
                    toast.success('New Notification', {
                        description: `📨 Received at ${new Date(item.inserted_at).toLocaleString()}`,
                        className: 'bg-gray-900 text-blue-200 border-gray-700 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
                    });
                }
            });
            setFeed(knockFeed.getState());
        };

        const handleItemsUpdate = () => {
            setFeed(knockFeed.getState());
        };

        if (!isConnected) {
            knockFeed.listenForUpdates();
            isConnected = true;
        }
        fetchFeed();

        knockFeed.on('items.received.realtime', handleRealtimeItems);
        knockFeed.on('items.*', handleItemsUpdate);

        return () => {
            knockFeed.off('items.received.realtime', handleRealtimeItems);
            knockFeed.off('items.*', handleItemsUpdate);
            knockFeed.teardown();
            isConnected = false;
        };
    }, [knockFeed]);

    const [feedItems, archivedItems] = useMemo(() => {
        const knockItems = feed?.items || [];
        const externalFeedItems: FeedItem[] = externalNotifications.map((notif) => ({
            id: notif.id,
            data: { showToast: true },
            inserted_at: notif.sentAt,
            updated_at: notif.sentAt,
            archived_at: null,
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
            source: 'in_app_feed' as unknown as NotificationSource,
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
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-[600px] bg-gray-900/95 rounded-2xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-gray-700"
        >
            <Tabs defaultValue="inbox">
                <TabsList className="bg-gray-800 rounded-xl">
                    {['inbox', 'archived', 'all'].map((tab, index) => (
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                        >
                            <TabsTrigger
                                value={tab}
                                className={cn(
                                    'text-gray-300 hover:text-blue-300',
                                    tab === 'inbox' && badgeCountVisible && !feed.loading && (
                                        <Badge className="ml-2" variant="secondary">
                                            {feed?.metadata?.unread_count || 0}
                                        </Badge>
                                    ),
                                )}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </TabsTrigger>
                        </motion.div>
                    ))}
                    <Separator orientation="vertical" className="bg-gray-600" />
                    <Dialog>
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                        >
                            <DialogTrigger className="mx-6 text-xl text-gray-300 hover:text-blue-300">⚙️</DialogTrigger>
                        </motion.div>
                        <DialogContent className="bg-gray-900 text-white border-gray-700 rounded-xl">
                            <DialogHeader>
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <DialogTitle className="text-blue-200">Notification Preferences</DialogTitle>
                                    <DialogDescription>
                                        <PreferenceCenter />
                                    </DialogDescription>
                                </motion.div>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </TabsList>
                <TabsContent value="inbox">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="my-6 flex"
                    >
                        <Button
                            variant="outline"
                            onClick={markAllAsRead}
                            className="w-full mr-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl border-gray-600"
                            asChild
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                            >
                                Mark all as read
                            </motion.button>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={markAllAsArchived}
                            className="w-full ml-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl border-gray-600"
                            asChild
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                            >
                                Archive all
                            </motion.button>
                        </Button>
                    </motion.div>
                    {feedItems?.length > 0 ? (
                        feedItems?.map((item: FeedItem, index: number) => {
                            const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                                >
                                    <FeedItemCard
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
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center my-12 py-12 bg-gray-800 rounded-xl"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <Inbox className="w-16 h-16 text-gray-300" />
                            </motion.div>
                            <p className="mt-6 text-gray-300">You're all caught up</p>
                        </motion.div>
                    )}
                </TabsContent>
                <TabsContent value="archived">
                    {archivedItems?.map((item: FeedItem, index: number) => {
                        const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                            >
                                <FeedItemCard
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
                            </motion.div>
                        );
                    })}
                </TabsContent>
                <TabsContent value="all">
                    {[...feedItems, ...archivedItems].map((item: FeedItem, index: number) => {
                        const externalNotif = externalNotifications.find((notif) => notif.id === item.id);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                            >
                                <FeedItemCard
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
                            </motion.div>
                        );
                    })}
                </TabsContent>
            </Tabs>
            <Toaster />
        </motion.div>
    );
};

export default NotificationFeed;
