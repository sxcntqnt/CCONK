// src/components/ui/magic-badge.tsx
import React from 'react';
import { cn } from '@/utils';

// Define the props interface
interface MagicBadgeProps {
    children: React.ReactNode; // For content inside the badge
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'; // Supported variants
    className?: string; // For custom styling
}

const MagicBadge: React.FC<MagicBadgeProps> = ({ children, variant = 'default', className }) => {
    // Define variant-specific styles
    const variantStyles = {
        default: 'bg-slate-950 text-white',
        secondary: 'bg-gray-500 text-white',
        outline: 'border border-gray-300 bg-transparent text-foreground',
        destructive: 'bg-red-500 text-white',
    };

    return (
        <div
            className={cn(
                'relative inline-flex h-8 select-none overflow-hidden rounded-full p-[1.5px] focus:outline-none',
                className,
            )}
        >
            <span
                className={cn(
                    'absolute inset-[-1000%] animate-[spin_3s_linear_infinite]',
                    variant === 'default' &&
                        'bg-[conic-gradient(from_90deg_at_50%_50%,#6d28d9_0%,#d8b4fe_50%,#6d28d9_100%)]',
                    variant === 'secondary' &&
                        'bg-[conic-gradient(from_90deg_at_50%_50%,#4b5563_0%,#9ca3af_50%,#4b5563_100%)]',
                    variant === 'outline' &&
                        'bg-[conic-gradient(from_90deg_at_50%_50%,#d1d5db_0%,#f3f4f6_50%,#d1d5db_100%)]',
                    variant === 'destructive' &&
                        'bg-[conic-gradient(from_90deg_at_50%_50%,#dc2626_0%,#f87171_50%,#dc2626_100%)]',
                )}
            />
            <span
                className={cn(
                    'inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full px-4 py-1 text-sm font-medium backdrop-blur-3xl',
                    variantStyles[variant],
                )}
            >
                {children}
            </span>
        </div>
    );
};

export default MagicBadge;
