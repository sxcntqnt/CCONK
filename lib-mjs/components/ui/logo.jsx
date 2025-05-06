import React from 'react';
import { Icons } from '@/components';
import { cn } from '@/utils';
const Logo = ({ variant = 'icon', className }) => {
    return (<>
            {variant === 'icon' ? (<Icons.logo className={cn('h-8 w-8 transition-all', className)}/>) : variant === 'text' ? (<Icons.wordmark className={cn('h-5 w-auto transition-all', className)}/>) : (<div className={cn('flex h-8 w-auto items-center space-x-2 transition-all', className)}>
                    <Icons.logo className="h-8 w-8 transition-all"/>
                    <Icons.wordmark className="h-5 w-auto transition-all"/>
                </div>)}
        </>);
};
export default Logo;
