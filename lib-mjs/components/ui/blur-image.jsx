'use client';
import { cn } from '@/utils';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
const BlurImage = ({ src, alt, className, ...props }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [url, setUrl] = useState(src);
    const handleLoad = (e) => {
        setIsLoading(false);
        const target = e.target;
        if (target.naturalWidth <= 32 && target.naturalHeight <= 32) {
            setUrl(`https://github.com/shadcn.png`);
        }
    };
    useEffect(() => {
        setUrl(src);
    }, [src]);
    return (<Image {...props} src={src} alt={alt} unoptimized onLoad={handleLoad} className={cn(isLoading ? 'blur-sm filter' : 'blur-0', className)}/>);
};
export default BlurImage;
