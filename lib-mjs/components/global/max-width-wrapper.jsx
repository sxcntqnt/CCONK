import { cn } from '@/utils';
import React from 'react';
const MaxWidthWrapper = ({ className, children }) => {
    return (<section className={cn('mx-auto h-full w-full max-w-full px-4 md:max-w-screen-xl md:px-12 lg:px-20', className)}>
            {children}
        </section>);
};
export default MaxWidthWrapper;
