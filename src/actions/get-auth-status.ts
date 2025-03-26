'use server';

import { db } from '@/lib';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const getAuthStatus = async () => {
    const user = await currentUser();

    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
        return { error: 'User not authenticated, please sign in' };
    }

    const clerkId = user.id;
    const email = user.primaryEmailAddress.emailAddress;
    const name = user.fullName || user.firstName || null;
    const image = user.imageUrl || 'img.clerk.com/default';

    console.log('clerkId:', clerkId, 'type:', typeof clerkId);
    console.log('email:', email, 'type:', typeof email);
    console.log('name:', name, 'type:', typeof name);
    console.log('image:', image, 'type:', typeof image);
    console.log('Data for create:', { clerkId, email, name, image });

    try {
        await db.$connect();
        console.log('Database connected successfully');

        const existingUser = await db.user.findFirst({
            where: { clerkId },
        });

        console.log('existingUser', existingUser);

        if (!existingUser) {
            const newUser = await db.user.create({
                data: {
                    clerkId,
                    email,
                    name,
                    image,
                },
            });
            console.log('New user created with id:', newUser.id); // Verify generated ID
        }

        return { success: true };
    } catch (error) {
        console.error('Database error:', error);
        return { error: 'Database connection failed' };
    }
};

export default getAuthStatus;
