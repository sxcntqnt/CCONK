'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/utils';

const STATES = ['off', 'intermediate', 'on'];

const TriStateSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const [state, setState] = React.useState(0); // 0 = off, 1 = intermediate, 2 = on

  const handleClick = () => {
    setState((prev) => (prev + 1) % 3);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{STATES[state]}</span>
      <SwitchPrimitives.Root
        className={cn(
          'relative flex h-6 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          state === 0 ? 'bg-gray-300' : state === 1 ? 'bg-yellow-400' : 'bg-green-500',
          className,
        )}
        onClick={handleClick}
        {...props}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            state === 0 ? 'translate-x-0' : state === 1 ? 'translate-x-4' : 'translate-x-8',
          )}
        />
      </SwitchPrimitives.Root>
    </div>
  );
});
TriStateSwitch.displayName = 'TriStateSwitch';

export { TriStateSwitch };

