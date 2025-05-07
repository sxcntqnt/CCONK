import { Archive, ArchiveRestore, BookmarkCheck, BookmarkX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Feed, FeedItem } from '@knocklabs/client';
import { ROLES, Role, KnockRecipient, BodyContentBlock } from '@/utils';
import { cn } from '@/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import MagicBadge from '@/components/ui/magic-badge';

type FeedItemCardProps = {
    item: FeedItem;
    knockFeed: Feed;
    userRole: Role;
};

export function FeedItemCard({ item, knockFeed, userRole }: FeedItemCardProps) {
    const content = (item.blocks?.find((block) => block.name === 'body') as BodyContentBlock | undefined) ?? {
        name: 'body',
        rendered: item.data?.message || 'No content available',
    };

    return (
        <div
            className={cn(
                'border-b border-[#333333] py-4 px-4',
                item.read_at ? 'opacity-70' : '',
                userRole === ROLES.PASSENGER &&
                    'border-blue-500 bg-gradient-to-r from-blue-500/10 to-teal-500/10 hover:shadow-blue-500/20',
                userRole === ROLES.DRIVER &&
                    'border-purple-500 bg-gradient-to-r from-purple-500/10 to-red-500/10 hover:shadow-purple-500/20',
                userRole === ROLES.OWNER &&
                    'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/20',
            )}
        >
            <div className="flex items-center mb-2 relative">
                {item.read_at === null ? <NewIcon /> : null}
                <Avatar>
                    <AvatarImage alt="Actor" src="https://v0.dev/placeholder.svg?height=40&width=40" />
                </Avatar>
                <div className="ml-2">
                    <p className="font-semibold">
                        {(item.actors as KnockRecipient[] | undefined)?.map((actor) => actor.name).join(' & ') ||
                            'Unknown'}{' '}
                        {item.data?.type === 'DRIVER_ARRIVAL' ? 'Driver Arrival' : item.data?.type || 'Notification'}{' '}
                        <span className="text-sm text-[#BBBBBB]">
                            {item.inserted_at
                                ? formatDistanceToNow(new Date(item.inserted_at), { addSuffix: true })
                                : 'Unknown time'}
                        </span>
                    </p>
                </div>
                <div className="ml-16 place-self-end flex items-center gap-2">
                    {(userRole === ROLES.DRIVER || userRole === ROLES.OWNER) && (
                        <MagicBadge
                            variant={item.read_at ? 'secondary' : 'default'}
                            className={cn(
                                item.read_at
                                    ? 'bg-gray-500'
                                    : userRole === ROLES.DRIVER
                                      ? 'bg-purple-500 hover:bg-purple-600'
                                      : 'bg-yellow-500 hover:bg-yellow-600',
                            )}
                        >
                            {item.read_at ? 'Read' : 'Unread'}
                        </MagicBadge>
                    )}
                    {item.read_at === null ? (
                        <Button
                            variant="outline"
                            size="icon"
                            className="mx-1"
                            onClick={() => knockFeed.markAsRead(item)}
                        >
                            <BookmarkCheck className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            className="mx-1"
                            onClick={() => knockFeed.markAsUnread(item)}
                        >
                            <BookmarkX className="h-4 w-4" />
                        </Button>
                    )}
                    {item.archived_at === null ? (
                        <Button
                            variant="outline"
                            size="icon"
                            className="mx-1"
                            onClick={() => knockFeed.markAsArchived(item)}
                        >
                            <Archive className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            className="mx-1"
                            onClick={() => knockFeed.markAsUnarchived(item)}
                        >
                            <ArchiveRestore className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="ml-[48px]">
                <p className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: content.rendered }} />
                {item.data?.tripId && <p className="text-xs text-muted-foreground mb-1">Trip ID: {item.data.tripId}</p>}
                {userRole === ROLES.PASSENGER && item.data?.tripId && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/trips/${item.data.tripId}`}>View Trip</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function NewIcon() {
    return (
        <div
            role="img"
            aria-label="New"
            style={{
                height: '8px',
                width: '8px',
                background: 'rgb(35, 131, 226)',
                position: 'absolute',
                borderRadius: '100%',
                left: '-12px',
                top: '16px',
                opacity: '1',
            }}
        />
    );
}
