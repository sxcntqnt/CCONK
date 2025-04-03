'use server';

import { db } from '@/lib';
import { currentUser } from '@clerk/nextjs/server';
import { Role } from '@/constants/roles';

const getAuthStatus = async () => {
    console.log('getAuthStatus - Starting server action');
    const user = await currentUser();

    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
        console.log('getAuthStatus - User not authenticated, currentUser:', user);
        return { error: 'User not authenticated, please sign in' };
    }

    const clerkId = user.id;
    const email = user.primaryEmailAddress.emailAddress;
    const name = user.fullName || user.firstName || null;
    const image = user.imageUrl || 'img.clerk.com/default';
    const role = (user.publicMetadata?.role as Role) || 'PASSENGER'; // Use publicMetadata

    console.log('getAuthStatus - User data:', { clerkId, email, name, image, role });

    try {
        console.log('getAuthStatus - Starting upsert operation');
        const updatedUser = await db.user.upsert({
            where: { clerkId },
            update: { email, name, image, role },
            create: { clerkId, email, name, image, role },
        });

        console.log('getAuthStatus - User upserted:', updatedUser);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('getAuthStatus - Database error during upsert:', errorMessage);
        return { error: 'Database connection failed' };
    }
};

export default getAuthStatus;
