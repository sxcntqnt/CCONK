// src/app/(main)/dashboard/notifications/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib';
import { ROLES, Role } from '@/utils/constants/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default async function NotificationsPage() {
    const user = await currentUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    // Get role from unsafeMetadata (consistent with your signup)
    const rawRole = user.unsafeMetadata.role as string | undefined;
    const role = rawRole?.toUpperCase().trim() as Role | undefined;

    if (!role) {
        redirect('/'); // Or '/dashboard' if preferred
    }

    // Fetch user from Prisma using clerkId
    const prismaUser = await db.user.findUnique({
        where: { clerkId: user.id },
    });

    if (!prismaUser) {
        return (
            <div className="container mx-auto py-8">
                <p>User data not found. Please try again later.</p>
            </div>
        );
    }

    // Fetch notifications for the user
    const notifications = await db.notification.findMany({
        where: {
            userId: prismaUser.id,
            status: 'sent', // Only show sent notifications
        },
        orderBy: { sentAt: 'desc' }, // Newest first
        take: 50, // Limit to 50 for performance
        include: {
            trip: { select: { id: true, departureCity: true, arrivalCity: true } },
            driver: { select: { id: true } },
        },
    });

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">No notifications yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <Card key={notification.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {notification.type === 'DRIVER_ARRIVAL' ? 'Driver Arrival' : notification.type}
                                </CardTitle>
                                <Badge variant="outline">
                                    {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{notification.message}</p>
                                {notification.trip && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Trip: {notification.trip.departureCity} → {notification.trip.arrivalCity}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
