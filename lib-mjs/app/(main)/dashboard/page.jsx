// src/app/(main)/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ROLES } from '@/utils/constants/roles';
export default async function DashboardPage({ searchParams }) {
    const user = await currentUser();
    if (!user) {
        redirect('/auth/sign-in');
    }
    // Resolve searchParams safely
    const resolvedSearchParams = await searchParams;
    const roleFromMetadata = user?.unsafeMetadata?.role?.toUpperCase().trim();
    const roleFromQuery = resolvedSearchParams.role?.toUpperCase().trim();
    const role = roleFromQuery || roleFromMetadata || ROLES.PASSENGER;
    // If no role is specified, redirect to home
    if (!role) {
        redirect('/');
    }
    // Redirect based on role
    switch (role) {
        case ROLES.PASSENGER:
            return redirect('/dashboard/passenger');
        case ROLES.DRIVER:
            return redirect('/dashboard/driver');
        case ROLES.OWNER:
            return redirect('/dashboard/owner');
        default:
            // Unknown role redirects to home
            redirect('/');
    }
}
