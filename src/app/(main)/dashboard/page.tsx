'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useClerk } from '@clerk/nextjs';

const DashboardPage = () => {
  const router = useRouter();

  const { user, signOut } = useClerk();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-xl font-medium">Welcome {user?.firstName}!</h1>
      <p className="mt-2 text-gray-500">You are signed in.</p>
      <div className="mt-4 flex items-center justify-center gap-4">
        <Button onClick={() => router.push('/')} variant="outline">
          Back to home
        </Button>
        <Button onClick={() => signOut()}>Sign Out</Button>
      </div>
    </div>
  );
};

export default DashboardPage;
