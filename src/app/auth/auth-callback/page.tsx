'use client';

import { getAuthStatus } from '@/actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AuthCallbackPage = () => {
    const router = useRouter();

    const { data, isLoading, error } = useQuery({
        queryKey: ['auth-status'],
        queryFn: async () => {
            console.log('AuthCallbackPage - Running getAuthStatus');
            return await getAuthStatus();
        },
        enabled: true,
        retry: 5, // Limited retries to avoid infinite loops
        retryDelay: 1000,
    });

    useEffect(() => {
        if (data?.success) {
            console.log('AuthCallbackPage - Auth successful, redirecting to dashboard');
            router.push('/dashboard');
        } else if (error || (data && !data.success)) {
            console.log('AuthCallbackPage - Auth failed, redirecting to sign-in');
            router.push('/auth/sign-in?error=auth-callback-failed');
        }
    }, [data, error, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center flex-col h-screen relative">
                <div className="border-[3px] border-neutral-800 rounded-full border-b-neutral-200 animate-loading w-8 h-8"></div>
                <p className="text-lg font-medium text-center mt-3">Verifying your account...</p>
            </div>
        );
    }

    return null;
};

export default AuthCallbackPage;
