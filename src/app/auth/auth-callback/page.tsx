'use client';

import { getAuthStatus } from '@/actions/get-auth-status';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const AuthCallbackPage = () => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  const { data, error } = useQuery({
    queryKey: ['auth-status'],
    queryFn: async () => await getAuthStatus(),
    enabled: isLoaded && !!userId,
    retry: true,
    retryDelay: 500,
  });

  if (data?.success) {
    router.push('/dashboard'); // Generic redirect; role handled downstream
  }

  if (error || data?.error) {
    console.error('Auth callback error:', error || data?.error);
  }

  if (!isLoaded) {
    return (
      <div className="relative flex h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-loading rounded-full border-[3px] border-neutral-800 border-b-neutral-200"></div>
        <p className="mt-3 text-center text-lg font-medium">
          Loading authentication...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col items-center justify-center">
      <div className="h-8 w-8 animate-loading rounded-full border-[3px] border-neutral-800 border-b-neutral-200"></div>
      <p className="mt-3 text-center text-lg font-medium">
        Verifying your account...
      </p>
    </div>
  );
};

export default AuthCallbackPage;
