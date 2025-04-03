// /src/app/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Role } from '@/constants/roles';

export default async function DashboardPage({ searchParams }: { searchParams: { role?: string } }) {
    const user = await currentUser();
    console.log('DashboardPage - user:', user?.id, 'searchParams:', searchParams);

    if (!user && !searchParams.role) {
        console.log('DashboardPage - No user or role, redirecting to /auth/sign-in');
        redirect('/auth/sign-in');
    }

    const role = (user?.public_metadata?.role as Role) || searchParams.role || 'PASSENGER';
    console.log('DashboardPage - Resolved role:', role);

    switch (role.toUpperCase()) {
        case 'PASSENGER':
            console.log('DashboardPage - Redirecting to /dashboard/passenger');
            redirect('/dashboard/passenger');
        case 'DRIVER':
            console.log('DashboardPage - Redirecting to /dashboard/driver');
            redirect('/dashboard/driver');
        case 'OWNER':
            console.log('DashboardPage - Redirecting to /dashboard/owner');
            redirect('/dashboard/owner');
        default:
            console.log('DashboardPage - Unknown role, defaulting to /dashboard/passenger');
            redirect('/dashboard/passenger');
    }
}

export DashboardPage ;
