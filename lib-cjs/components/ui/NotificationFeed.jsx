"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const nextjs_1 = require("@clerk/nextjs");
const react_2 = require("@knocklabs/react");
require("@knocklabs/react/dist/index.css");
const card_1 = require("@/components/ui/card");
const utils_1 = require("@/utils");
const date_fns_1 = require("date-fns");
const roles_1 = require("@/utils/constants/roles");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
// Custom wrapper for NotificationIconButton
const CustomNotificationIconButton = ({ badgeCountVisible = true, ...props }) => {
    const { useFeedStore } = (0, react_2.useKnockFeed)();
    const { metadata } = useFeedStore();
    const unreadCount = metadata?.unread_count || 0;
    return (<div className="relative">
            <react_2.NotificationIconButton {...props}/>
            {badgeCountVisible && unreadCount > 0 && (<magic_badge_1.default variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 text-xs rounded-full font-bold">
                    {unreadCount}
                </magic_badge_1.default>)}
        </div>);
};
const NotificationFeed = ({ badgeCountVisible = true, customRenderer = false, userRole }) => {
    const [isVisible, setIsVisible] = (0, react_1.useState)(false);
    const notifButtonRef = (0, react_1.useRef)(null);
    const { user } = (0, nextjs_1.useUser)();
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
    return (<react_2.KnockProvider apiKey={KNOCK_API_KEY} userId={user.id}>
            <react_2.KnockFeedProvider feedId={KNOCK_FEED_ID}>
                <>
                    <CustomNotificationIconButton ref={notifButtonRef} onClick={handleClick} badgeCountVisible={badgeCountVisible}/>
                    <react_2.NotificationFeedContainer>
                        <react_2.NotificationFeedPopover buttonRef={notifButtonRef} isVisible={isVisible} onClose={() => setIsVisible(false)} renderItem={customRenderer
            ? ({ item }) => (<react_2.NotificationCell item={item}>
                                              <card_1.Card className={(0, utils_1.cn)('transition-all duration-200', userRole === roles_1.ROLES.PASSENGER &&
                    'border-blue-500 bg-gradient-to-r from-blue-500/10 to-teal-500/10 hover:shadow-blue-500/20', userRole === roles_1.ROLES.DRIVER &&
                    'border-purple-500 bg-gradient-to-r from-purple-500/10 to-red-500/10 hover:shadow-purple-500/20', userRole === roles_1.ROLES.OWNER &&
                    'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/20')}>
                                                  <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
                                                      <card_1.CardTitle className="text-sm font-medium">
                                                          {item.data?.type === 'DRIVER_ARRIVAL'
                    ? 'Driver Arrival'
                    : item.data?.type || 'Notification'}
                                                      </card_1.CardTitle>
                                                      <div className="flex items-center gap-2">
                                                          {(userRole === roles_1.ROLES.DRIVER || userRole === roles_1.ROLES.OWNER) && (<magic_badge_1.default variant={item.seen_at ? 'secondary' : 'default'} className={(0, utils_1.cn)(item.seen_at
                        ? 'bg-gray-500'
                        : userRole === roles_1.ROLES.DRIVER
                            ? 'bg-purple-500 hover:bg-purple-600'
                            : 'bg-yellow-500 hover:bg-yellow-600')}>
                                                                  {item.seen_at ? 'Read' : 'Unread'}
                                                              </magic_badge_1.default>)}
                                                          <magic_badge_1.default variant="outline">
                                                              {item.inserted_at
                    ? (0, date_fns_1.formatDistanceToNow)(new Date(item.inserted_at), {
                        addSuffix: true,
                    })
                    : 'Unknown time'}
                                                          </magic_badge_1.default>
                                                      </div>
                                                  </card_1.CardHeader>
                                                  <card_1.CardContent>
                                                      <p className="text-sm">
                                                          {item.data?.message ||
                    `${item.data?.driverName || 'Driver'} has arrived at ${item.data?.destination || 'destination'} with bus ${item.data?.busId || 'unknown'}.`}
                                                      </p>
                                                      {item.data?.tripId && (<p className="text-xs text-muted-foreground mt-1">
                                                              Trip ID: {item.data.tripId}
                                                          </p>)}
                                                      {userRole === roles_1.ROLES.PASSENGER && item.data?.tripId && (<button_1.Button variant="outline" size="sm" className="mt-2" asChild>
                                                              <link_1.default href={`/dashboard/trips/${item.data.tripId}`}>
                                                                  View Trip
                                                              </link_1.default>
                                                          </button_1.Button>)}
                                                  </card_1.CardContent>
                                              </card_1.Card>
                                          </react_2.NotificationCell>)
            : undefined}/>
                    </react_2.NotificationFeedContainer>
                </>
            </react_2.KnockFeedProvider>
        </react_2.KnockProvider>);
};
exports.default = NotificationFeed;
