// src/app/(main)/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Role } from '@/utils/constants/roles';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
    const user = await currentUser();

    // Middleware should have already redirected unauthenticated users to /auth/sign-in
    // If user is null here, log it as an unexpected case and redirect as a fallback
    if (!user) {
        console.error('Unexpected: User is null after middleware check');
        redirect('/auth/sign-in');
    }

    // Resolve searchParams safely
    const resolvedSearchParams = await searchParams;
    const roleFromMetadata = user.publicMetadata?.role as Role | undefined;
    const roleFromQuery = resolvedSearchParams.role;
    
    // Determine role with a fallback chain: metadata > query > default
    const role = roleFromMetadata || roleFromQuery || 'PASSENGER';

    // Normalize role to uppercase for consistency
    const normalizedRole = role.toUpperCase();

    // Redirect based on role, with a default fallback
    switch (normalizedRole) {
        case 'PASSENGER':
            return redirect('/dashboard/passenger');
        case 'DRIVER':
            return redirect('/dashboard/driver');
        case 'OWNER':
            return redirect('/dashboard/owner');
        default:
            console.warn(`Unknown role '${role}', defaulting to PASSENGER`);
            return redirect('/dashboard/passenger');
    }
}
