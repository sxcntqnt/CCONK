'use client';

import { AnimationContainer, MaxWidthWrapper } from '@/components';
import Image from 'next/image';
import { MATATU_PARTNERS } from '@/utils/constants/misc';

export default function PartnersSection() {
    return (
        <MaxWidthWrapper>
            <AnimationContainer delay={0.4}>
                <div className="py-10">
                    <div className="mx-auto px-4 md:px-8">
                        <h2 className="text-center text-sm font-medium font-heading text-[hsl(var(--muted-foreground))]">
                            Trusted by leading matatu operators across Nairobi
                        </h2>
                        {MATATU_PARTNERS.length > 0 ? (
                            <ul
                                className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 md:gap-x-16"
                                aria-label="Trusted matatu operator partners"
                            >
                                {MATATU_PARTNERS.map((partner) => (
                                    <li key={partner.name}>
                                        <Image
                                            src={partner.logo}
                                            alt={partner.name}
                                            width={80}
                                            height={80}
                                            quality={100}
                                            className="h-auto w-28 animate-image-glow"
                                            onError={() => console.error(`Failed to load ${partner.logo}`)}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-8 text-center text-[hsl(var(--muted-foreground))]">
                                No partners available
                            </p>
                        )}
                    </div>
                </div>
            </AnimationContainer>
        </MaxWidthWrapper>
    );
}
