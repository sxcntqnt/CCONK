import { MaxWidthWrapper } from '@/components';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

interface Props {
  children: React.ReactNode;
}

const MarketingLayout = ({ children }: Props) => {
  return (
    <MaxWidthWrapper>
      <Toaster richColors theme="dark" position="top-right" />
      <main className="relative mx-auto w-full">{children}</main>
    </MaxWidthWrapper>
  );
};

export default MarketingLayout;
