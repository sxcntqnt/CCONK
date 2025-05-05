"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotificationsPage;
const nextjs_1 = require("@clerk/nextjs");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const card_1 = require("@/components/ui/card");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const form_1 = require("@/components/ui/form");
const utils_1 = require("@/utils");
const date_fns_1 = require("date-fns");
const roles_1 = require("@/utils/constants/roles");
const link_1 = __importDefault(require("next/link"));
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const z = __importStar(require("zod"));
const notify_driver_arrival_1 = require("@/actions/notify-driver-arrival");
const NotificationFeed_1 = __importDefault(require("@/components/ui/NotificationFeed"));
// Form schema for notification submission
const formSchema = z.object({
    destination: z.string().min(2, 'Destination must be at least 2 characters').max(100),
});
function NotificationsPage() {
    const { user } = (0, nextjs_1.useUser)();
    // Redirect if not authenticated
    if (!user) {
        (0, navigation_1.redirect)('/auth/sign-in');
    }
    // Get role from unsafeMetadata
    const role = user.unsafeMetadata.role;
    // Redirect if role is invalid or missing
    if (!role || !Object.values(roles_1.ROLES).includes(role)) {
        (0, navigation_1.redirect)('/');
    }
    // Form setup for Drivers and Owners
    const form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(formSchema),
        defaultValues: { destination: '' },
    });
    // Submit handler for notifyDriverArrival
    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append('destination', data.destination);
            await (0, notify_driver_arrival_1.notifyDriverArrival)(formData);
            form.reset();
        }
        catch (error) {
            form.setError('root', {
                message: error instanceof Error ? error.message : 'Failed to send notification',
            });
        }
    };
    // Fetch Prisma notifications
    const { data: prismaNotifications = [], isLoading, error: prismaError, } = (0, react_query_1.useQuery)({
        queryKey: ['prisma-notifications', user.id],
        queryFn: async () => {
            const response = await fetch(`/api/notifications?userId=${user.id}`);
            if (!response.ok)
                throw new Error('Failed to fetch Prisma notifications');
            return response.json();
        },
        enabled: !!user.id,
    });
    return (<div className={(0, utils_1.cn)('container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min')}>
            <div className="col-span-12 lg:col-span-8">
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                {(role === roles_1.ROLES.DRIVER || role === roles_1.ROLES.OWNER) && (<card_1.Card className="mb-6">
                        <card_1.CardHeader>
                            <card_1.CardTitle>Send Arrival Notification</card_1.CardTitle>
                        </card_1.CardHeader>
                        <card_1.CardContent>
                            <form_1.Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <form_1.FormField control={form.control} name="destination" render={({ field }) => (<form_1.FormItem>
                                                <form_1.FormLabel>Destination</form_1.FormLabel>
                                                <form_1.FormControl>
                                                    <input_1.Input placeholder="Enter destination" {...field}/>
                                                </form_1.FormControl>
                                                <form_1.FormMessage />
                                            </form_1.FormItem>)}/>
                                    <button_1.Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'Sending...' : 'Notify Arrival'}
                                    </button_1.Button>
                                </form>
                            </form_1.Form>
                        </card_1.CardContent>
                    </card_1.Card>)}

                {/* Use the NotificationFeed component for Knock notifications */}
                <div className="flex justify-end mb-4">
                    <NotificationFeed_1.default badgeCountVisible={true} customRenderer={true} userRole={role}/>
                </div>

                {/* Prisma notifications display */}
                {isLoading ? (<card_1.Card>
                        <card_1.CardContent className="pt-6">
                            <p className="text-muted-foreground">Loading notifications...</p>
                        </card_1.CardContent>
                    </card_1.Card>) : prismaError ? (<card_1.Card>
                        <card_1.CardContent className="pt-6">
                            <p className="text-destructive">Failed to load notifications: {prismaError.message}</p>
                        </card_1.CardContent>
                    </card_1.Card>) : prismaNotifications.length === 0 ? (<card_1.Card>
                        <card_1.CardContent className="pt-6">
                            <p className="text-muted-foreground">No notifications yet.</p>
                        </card_1.CardContent>
                    </card_1.Card>) : (<div className="space-y-4">
                        {prismaNotifications.map((notif) => {
                const mappedNotif = {
                    id: `prisma-${notif.id}`,
                    type: notif.type,
                    message: notif.message,
                    sentAt: notif.sentAt,
                    tripId: notif.tripId?.toString(),
                    source: 'prisma',
                };
                return (<card_1.Card key={mappedNotif.id} className={(0, utils_1.cn)('transition-all duration-200', role === roles_1.ROLES.PASSENGER &&
                        'border-blue-500 bg-gradient-to-r from-blue-500/10 to-teal-500/10 hover:shadow-blue-500/20', role === roles_1.ROLES.DRIVER &&
                        'border-purple-500 bg-gradient-to-r from-purple-500/10 to-red-500/10 hover:shadow-purple-500/20', role === roles_1.ROLES.OWNER &&
                        'border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/20')}>
                                    <card_1.CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <card_1.CardTitle className="text-sm font-medium">
                                            {mappedNotif.type === 'DRIVER_ARRIVAL'
                        ? 'Driver Arrival'
                        : mappedNotif.type || 'Notification'}
                                        </card_1.CardTitle>
                                        <magic_badge_1.default variant="outline">
                                            {mappedNotif.sentAt
                        ? (0, date_fns_1.formatDistanceToNow)(new Date(mappedNotif.sentAt), {
                            addSuffix: true,
                        })
                        : 'Unknown time'}
                                        </magic_badge_1.default>
                                    </card_1.CardHeader>
                                    <card_1.CardContent>
                                        <p className="text-sm">{mappedNotif.message}</p>
                                        {mappedNotif.tripId && (<p className="text-xs text-muted-foreground mt-1">
                                                Trip ID: {mappedNotif.tripId}
                                            </p>)}
                                        {role === roles_1.ROLES.PASSENGER && mappedNotif.tripId && (<button_1.Button variant="outline" size="sm" className="mt-2" asChild>
                                                <link_1.default href={`/dashboard/trips/${mappedNotif.tripId}`}>View Trip</link_1.default>
                                            </button_1.Button>)}
                                    </card_1.CardContent>
                                </card_1.Card>);
            })}
                    </div>)}
            </div>
        </div>);
}
