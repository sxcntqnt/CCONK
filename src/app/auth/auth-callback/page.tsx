'use client';

import { getAuthStatus } from '@/actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

const AuthCallbackPage = () => {
    const router = useRouter();
    const { isLoaded: authLoaded, userId } = useAuth();
    const { isLoaded: userLoaded, user } = useUser();

    const { data, error, isLoading } = useQuery({
        queryKey: ['auth-status'],
        queryFn: async () => {
            console.log('AuthCallbackPage - Running getAuthStatus');
            return await getAuthStatus();
        },
        enabled: authLoaded && !!userId,
        retry: 3,
        retryDelay: 1000,
    });

    useEffect(() => {
        if (data?.success && user) {
            const role = (user.publicMetadata?.role as string) || 'PASSENGER';
            console.log('AuthCallbackPage - Redirecting to dashboard with role:', role);
            router.push(`/dashboard?role=${encodeURIComponent(role)}`);
        } else if (error || data?.error) {
            console.error('AuthCallbackPage - Error:', error || data?.error);
            router.push('/auth/sign-in?error=auth-failed');
        }
    }, [data, error, user, router]);

    if (!authLoaded || isLoading) {
        return (
            <div className="relative flex h-screen flex-col items-center justify-center">
                <div className="h-8 w-8 animate-loading rounded-full border-[3px] border-neutral-800 border-b-neutral-200"></div>
                <p className="mt-3 text-center text-lg font-medium">
                    {isLoading ? 'Verifying your account...' : 'Loading authentication...'}
                </p>
            </div>
        );
    }

    return null;
};

export default AuthCallbackPage;
