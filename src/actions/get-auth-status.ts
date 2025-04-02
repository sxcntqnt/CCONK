'use server';

import { db } from '@/lib';
import { currentUser } from '@clerk/nextjs/server';
import { Role } from '@/constants/roles'; // Import Role type

const getAuthStatus = async () => {
    const user = await currentUser();

    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
        return { error: 'User not authenticated, please sign in' };
    }

    const clerkId = user.id;
    const email = user.primaryEmailAddress.emailAddress;
    const name = user.fullName || user.firstName || null;
    const image = user.imageUrl || 'img.clerk.com/default';
    const role = (user.unsafeMetadata?.role as Role) || 'PASSENGER'; // Sync role from Clerk, default to PASSENGER

    console.log('clerkId:', clerkId, 'type:', typeof clerkId);
    console.log('email:', email, 'type:', typeof email);
    console.log('name:', name, 'type:', typeof name);
    console.log('image:', image, 'type:', typeof image);
    console.log('role:', role, 'type:', typeof role);
    console.log('Data for upsert:', { clerkId, email, name, image, role });

    try {
        await db.$connect();
        console.log('Database connected successfully');

        // Upsert to handle both new and existing users
        const updatedUser = await db.user.upsert({
            where: { clerkId },
            update: {
                email,
                name,
                image,
                role, // Update role in case it changed
            },
            create: {
                clerkId,
                email,
                name,
                image,
                role, // Set role for new users
            },
        });

        console.log('User upserted:', updatedUser);

        return { success: true };
    } catch (error) {
        console.error('Database error:', error);
        return { error: 'Database connection failed' };
    }
};

export default getAuthStatus;
