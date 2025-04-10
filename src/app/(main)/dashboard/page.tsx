// src/app/(main)/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ROLES, Role } from '@/utils/constants/roles';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
    const user = await currentUser();

    if (!user) {
        redirect('/auth/sign-in');
    }

    // Resolve searchParams safely
    const resolvedSearchParams = await searchParams;
    const roleFromMetadata = (user.unsafeMetadata?.role as string | undefined)?.toUpperCase().trim() as
        | Role
        | undefined;
    const roleFromQuery = (resolvedSearchParams.role as string | undefined)?.toUpperCase().trim() as Role | undefined;

    // Determine role with a fallback chain: unsafeMetadata > query > undefined
    const role = roleFromMetadata || roleFromQuery;

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
