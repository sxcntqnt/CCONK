'use client';

import { AnimationContainer, MaxWidthWrapper } from '@/components';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@clerk/nextjs/server';

interface HeroSectionProps {
    user: User | null;
}

export default function HeroSection({ user }: HeroSectionProps) {
    return (
        <MaxWidthWrapper>
            <div className="flex flex-col items-center justify-center w-full text-center bg-[hsl(var(--background))] py-10">
                <AnimationContainer
                    delay={0.1}
                    className="flex flex-col items-center justify-center w-full text-center"
                >
                    <button
                        className="group rounded-full px-4 py-1 bg-[hsl(var(--card))] text-[hsl(var(--foreground))] flex items-center gap-1 animate-shimmer border-[hsl(var(--border))]"
                        aria-label="Announcement: Now live in Nairobi"
                    >
                        <span className="z-10 py-0.5 text-sm flex items-center justify-center gap-1">
                            ✨ Now live in Nairobi
                            <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                        </span>
                    </button>

                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl md:text-6xl lg:text-7xl">
                        Fleet Management with{' '}
                        <span className="text-transparent bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text">
                            Precision
                        </span>
                    </h1>
                    <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-2xl">
                        Transform your matatu experience with FLAM, the ultimate fleet tracking solution. Real-time
                        tracking, route optimization, and smart notifications all in one platform.
                    </p>
                    <div className="mt-8 flex items-center gap-4">
                        <Button asChild>
                            <Link href={user ? '/dashboard' : '/auth/sign-in'} className="flex items-center">
                                Start tracking now
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-12 rounded-[var(--border-radius-lg)] border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-2 backdrop-blur-sm">
                        <Image
                            src="/assets/dashboard-dark.svg"
                            alt="FLAM Dashboard showing live matatu tracking"
                            width={1200}
                            height={1200}
                            quality={100}
                            className="rounded-[var(--border-radius-md)]"
                            onError={() => console.error('Failed to load dashboard image')}
                        />
                    </div>
                </AnimationContainer>
            </div>
        </MaxWidthWrapper>
    );
}
