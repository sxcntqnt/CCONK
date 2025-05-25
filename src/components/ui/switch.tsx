'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { motion } from 'motion/react';
import { cn } from '@/utils';

interface TriStateSwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    stateLabels?: [string, string, string];
}

const STATES = ['off', 'intermediate', 'on'];

const TriStateSwitch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, TriStateSwitchProps>(
    ({ className, stateLabels = STATES, ...props }, ref) => {
        const [state, setState] = React.useState(0); // 0 = off, 1 = intermediate, 2 = on

        const handleClick = () => {
            setState((prev) => (prev + 1) % 3);
        };

        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{stateLabels[state]}</span>
                <SwitchPrimitives.Root
                    className={cn(
                        'relative flex h-6 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50',
                        state === 0 ? 'bg-gray-600' : state === 1 ? 'bg-yellow-500' : 'bg-green-500',
                        className,
                    )}
                    onClick={handleClick}
                    {...props}
                    ref={ref}
                >
                    <motion.div
                        className={cn(
                            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
                            'bg-gradient-to-r from-blue-400 to-blue-600',
                        )}
                        animate={{
                            x: state === 0 ? 0 : state === 1 ? 16 : 32,
                            transition: { type: 'spring', stiffness: 200, damping: 20 },
                        }}
                    />
                </SwitchPrimitives.Root>
            </div>
        );
    },
);
TriStateSwitch.displayName = 'TriStateSwitch';

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
    ({ className, onCheckedChange, ...props }, ref) => {
        return (
            <SwitchPrimitives.Root
                className={cn(
                    'relative flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50',
                    props.checked ? 'bg-blue-500' : 'bg-gray-600',
                    className,
                )}
                onCheckedChange={onCheckedChange}
                {...props}
                ref={ref}
            >
                <motion.div
                    className={cn(
                        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
                        'bg-gradient-to-r from-blue-400 to-blue-600',
                    )}
                    animate={{
                        x: props.checked ? 24 : 0,
                        transition: { type: 'spring', stiffness: 200, damping: 20 },
                    }}
                />
            </SwitchPrimitives.Root>
        );
    },
);
Switch.displayName = 'Switch';

export { Switch, TriStateSwitch };
