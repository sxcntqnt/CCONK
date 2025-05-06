'use client';
import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { KnockProvider, KnockFeedProvider, NotificationIconButton, NotificationFeedPopover, NotificationFeedContainer, NotificationCell, useKnockFeed, } from '@knocklabs/react';
import '@knocklabs/react/dist/index.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { ROLES } from '@/utils/constants/roles';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MagicBadge from '@/components/ui/magic-badge';
// Custom wrapper for NotificationIconButton
const CustomNotificationIconButton = ({ badgeCountVisible = true, ...props }) => {
    const { useFeedStore } = useKnockFeed();
    const { metadata } = useFeedStore();
    const unreadCount = metadata?.unread_count || 0;
    return (<div className="relative">
            <NotificationIconButton {...props}/>
            {badgeCountVisible && unreadCount > 0 && (<MagicBadge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 text-xs rounded-full font-bold">
                    {unreadCount}
                </MagicBadge>)}
        </div>);
};
const NotificationFeed = ({ badgeCountVisible = true, customRenderer = false, userRole }) => {
    const [isVisible, setIsVisible] = useState(false);
    const notifButtonRef = useRef(null);
    const { user } = useUser();
    if (!user)
        return null;
    const handleClick = () => {
        setIsVisible(!isVisible);
    };
    const KNOCK_API_KEY = process.env.NEXT_PUBLIC_KNOCK_API_KEY || '';
    const KNOCK_FEED_ID = process.env.NEXT_PUBLIC_KNOCK_FEED_ID || '';
    if (!KNOCK_API_KEY || !KNOCK_FEED_ID) {
        console.warn('Knock API key or feed ID is missing');
        return null;
    }
    return (<KnockProvider apiKey={KNOCK_API_KEY} userId={user.id}>
            <KnockFeedProvider feedId={KNOCK_FEED_ID}>
                <>
                    <CustomNotificationIconButton ref={notifButtonRef} onClick={handleClick} badgeCountVisible={badgeCountVisible}/>
                    <NotificationFeedContainer>
                        <NotificationFeedPopover buttonRef={notifButtonRef} isVisible={isVisible} onClose={() => setIsVisible(false)} renderItem={customRenderer
            ? ({ item }) => (<NotificationCell item={item}>
                                              <Card className={cn('transition-all duration-200', userRole === ROLES.PASSENGER &&
                    'border-blue-500 bg-gradient-to-r from-blue-500/10 to-teal-500/10 hover:shadow-blue-500/20', userRole === ROLES.DRIVER &&
                    'border-purple-500 bg-gradient-to-r from-purple-500/10 to-red-500/10 hover:shadow-purple-500/20', userRole === ROLES.OWNER &&
                    'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/20')}>
                                                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                      <CardTitle className="text-sm font-medium">
                                                          {item.data?.type === 'DRIVER_ARRIVAL'
                    ? 'Driver Arrival'
                    : item.data?.type || 'Notification'}
                                                      </CardTitle>
                                                      <div className="flex items-center gap-2">
                                                          {(userRole === ROLES.DRIVER || userRole === ROLES.OWNER) && (<MagicBadge variant={item.seen_at ? 'secondary' : 'default'} className={cn(item.seen_at
                        ? 'bg-gray-500'
                        : userRole === ROLES.DRIVER
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-yellow-500 hover:bg-yellow-600')}>
                                                                  {item.seen_at ? 'Read' : 'Unread'}
                                                              </MagicBadge>)}
                                                          <MagicBadge variant="outline">
                                                              {item.inserted_at
                    ? formatDistanceToNow(new Date(item.inserted_at), {
                        addSuffix: true,
                    })
                    : 'Unknown time'}
                                                          </MagicBadge>
                                                      </div>
                                                  </CardHeader>
                                                  <CardContent>
                                                      <p className="text-sm">
                                                          {item.data?.message ||
                    `${item.data?.driverName || 'Driver'} has arrived at ${item.data?.destination || 'destination'} with bus ${item.data?.busId || 'unknown'}.`}
                                                      </p>
                                                      {item.data?.tripId && (<p className="text-xs text-muted-foreground mt-1">
                                                              Trip ID: {item.data.tripId}
                                                          </p>)}
                                                      {userRole === ROLES.PASSENGER && item.data?.tripId && (<Button variant="outline" size="sm" className="mt-2" asChild>
                                                              <Link href={`/dashboard/trips/${item.data.tripId}`}>
                                                                  View Trip
                                                              </Link>
                                                          </Button>)}
                                                  </CardContent>
                                              </Card>
                                          </NotificationCell>)
            : undefined}/>
                    </NotificationFeedContainer>
                </>
            </KnockFeedProvider>
        </KnockProvider>);
};
export default NotificationFeed;
