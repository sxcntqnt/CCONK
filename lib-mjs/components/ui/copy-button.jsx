'use client';
import { cn } from '@/utils';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
const CopyButton = ({ text, className, icon }) => {
    const [isCopied, setIsCopied] = useState(false);
    const Comp = icon || Copy;
    const handleClick = (e) => {
        e.stopPropagation();
        setIsCopied(true);
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Copied to clipboard!');
        });
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };
    return (<button className={cn('group flex items-center justify-center rounded-md bg-foreground/10 p-2 transition-all duration-100 hover:scale-105 hover:bg-foreground/20 active:scale-95', className)}>
            <span className="sr-only">Copy</span>
            {isCopied ? (<Check className="text-neutral-700 group-hover:text-accent"/>) : (<Comp className="text-neutral-700 group-hover:text-foreground"/>)}
        </button>);
};
export default CopyButton;
