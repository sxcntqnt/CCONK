import { AnimationContainer, MaxWidthWrapper } from '@/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MagicBadge from '@/components/ui/magic-badge';
import MagicCard from '@/components/ui/magic-card';
import { ArrowRightIcon, StarIcon } from 'lucide-react';
import { SewingPinIcon, BellIcon, BarChartIcon } from '@radix-ui/react-icons';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { FLAM_FEATURES, TESTIMONIALS, MATATU_PARTNERS, FLAM_USE_CASES } from '@/utils/constants/misc';
import HeroSection from '@/components/ui/HeroSection';
import PartnersSection from '@/components/ui/PartnersSection';
import { BentoGrid, BentoCard, CARDS } from '@/components/ui/bento-grid';

// Define constants for reuse in other files
export const FLAM_PROCESS = [
    {
        icon: SewingPinIcon,
        title: 'Track Your Matatu',
        description: 'Enter your route and see real-time locations of all matatus on your selected path.',
    },
    {
        icon: BarChartIcon,
        title: 'Optimize Your Journey',
        description: 'Get recommendations for fastest routes and estimated arrival times.',
    },
    {
        icon: BellIcon,
        title: 'Stay Informed',
        description: 'Receive notifications about arrivals, delays, and changes to your usual routes.',
    },
];

const EnterprisePage = async () => {
    const user = await currentUser().catch(() => null);

    return (
        <div className="overflow-x-hidden scrollbar-hide size-full">
            {/* Hero Section */}
            <HeroSection user={user} />

            {/* Partners Section */}
            <PartnersSection />

            {/* Features Section (with BentoGrid) */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MagicBadge title="Features" />
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Smart Matatu Management For Everyone
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            FLAM is a powerful fleet management platform that helps commuters save time and operators
                            improve service.
                        </p>
                    </div>
                </AnimationContainer>
                <AnimationContainer delay={0.2}>
                    <BentoGrid>
                        {CARDS.map((card, idx) => (
                            <BentoCard
                                key={idx}
                                name={card.name}
                                className={card.className}
                                background={card.background}
                                Icon={card.Icon}
                                description={card.description}
                                href={card.href}
                                cta={card.cta}
                            />
                        ))}
                    </BentoGrid>
                </AnimationContainer>
            </MaxWidthWrapper>

            {/* Process Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <MagicBadge title="How It Works" />
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Transform your commute in 3 simple steps
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Getting started with FLAM is quick and easy, putting real-time matatu information at your
                            fingertips.
                        </p>
                    </div>
                </AnimationContainer>
                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full py-8 gap-4 md:gap-8 min-w-0"
                    aria-label="Steps to use FLAM for matatu management"
                >
                    {FLAM_PROCESS.map((process, id) => (
                        <AnimationContainer delay={0.2 * id} key={id}>
                            <Card className="relative transition-shadow hover:shadow-lg animate-wiggle group md:py-8">
                                <span className="absolute -top-6 right-0 border-2 border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium text-2xl rounded-full w-12 h-12 flex items-center justify-center pt-0.5">
                                    {id + 1}
                                </span>
                                <CardHeader>
                                    <process.icon
                                        className="h-10 w-10 text-[hsl(var(--foreground))]"
                                        strokeWidth={1.5}
                                    />
                                    <CardTitle>{process.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-[hsl(var(--muted-foreground))]">{process.description}</p>
                                </CardContent>
                            </Card>
                        </AnimationContainer>
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* Pricing Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <MagicBadge title="Flexible Plans" />
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Plans for commuters and operators
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Start with our free plan and upgrade to premium features as your needs grow.
                        </p>
                    </div>
                </AnimationContainer>
                <AnimationContainer delay={0.2}>
                    <div className="mt-8 max-w-5xl mx-auto">
                        <Card className="animate-wiggle">
                            <CardHeader>
                                <CardTitle>Pricing</CardTitle>
                                <CardDescription>Contact us for detailed pricing plans</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[hsl(var(--muted-foreground))]">
                                    Flexible plans tailored for commuters and operators.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" asChild>
                                    <Link href="/pricing">Learn more</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </AnimationContainer>
                <AnimationContainer delay={0.3}>
                    <div
                        className="flex flex-wrap items-center justify-center gap-6 mt-12 max-w-5xl mx-auto w-full"
                        aria-label="Pricing benefits"
                    >
                        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                            <svg
                                className="h-5 w-5 text-[hsl(var(--foreground))]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span>Special discounts for fleet operators</span>
                        </div>
                    </div>
                </AnimationContainer>
            </MaxWidthWrapper>

            {/* Testimonials Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <MagicBadge title="Success Stories" />
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            What our users are saying
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Here's what commuters and operators have to say about FLAM.
                        </p>
                    </div>
                </AnimationContainer>
                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-start gap-4 md:gap-8 py-10 min-w-0"
                    aria-label="User testimonials for FLAM"
                >
                    {TESTIMONIALS.length > 0 ? (
                        TESTIMONIALS.map((testimonial, index) => (
                            <AnimationContainer delay={0.2 * index} key={index}>
                                <MagicCard className="md:p-0">
                                    <Card className="flex flex-col w-full border-none h-min transition-shadow hover:shadow-lg animate-wiggle">
                                        <CardHeader className="space-y-0">
                                            <CardTitle className="text-lg font-medium text-[hsl(var(--muted-foreground))]">
                                                {testimonial.name}
                                            </CardTitle>
                                            <CardDescription>{testimonial.userType}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pb-4">
                                            <p className="text-[hsl(var(--muted-foreground))]">
                                                {testimonial.testimony}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="w-full space-x-1 mt-auto">
                                            {Array.from({ length: testimonial.rating }, (_, i) => (
                                                <StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                            ))}
                                        </CardFooter>
                                    </Card>
                                </MagicCard>
                            </AnimationContainer>
                        ))
                    ) : (
                        <p className="text-center text-[hsl(var(--muted-foreground))]">No testimonials available</p>
                    )}
                </div>
            </MaxWidthWrapper>

            {/* Use Cases Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <MagicBadge title="Real World Impact" />
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            FLAM in action
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Discover how FLAM is transforming public transportation in Nairobi.
                        </p>
                    </div>
                </AnimationContainer>
                <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-10 min-w-0"
                    aria-label="FLAM use cases for public transportation"
                >
                    {FLAM_USE_CASES.length > 0 ? (
                        FLAM_USE_CASES.map((useCase, index) => (
                            <AnimationContainer delay={0.2 * index} key={index}>
                                <Card className="flex flex-col transition-shadow hover:shadow-lg animate-wiggle">
                                    <CardHeader>
                                        <useCase.icon className="h-12 w-12 text-[hsl(var(--primary))]" />
                                        <CardTitle>{useCase.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4 pb-4">
                                        <p className="text-[hsl(var(--muted-foreground))]">{useCase.description}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" asChild>
                                            <Link href={useCase.link}>
                                                Learn more
                                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </AnimationContainer>
                        ))
                    ) : (
                        <p className="text-center text-[hsl(var(--muted-foreground))]">No use cases available</p>
                    )}
                </div>
            </MaxWidthWrapper>

            {/* CTA Section */}
            <MaxWidthWrapper className="py-10 mt-20 max-w-[100vw] overflow-x-hidden scrollbar-hide">
                <AnimationContainer delay={0.1}>
                    <div
                        className="flex flex-col items-center justify-center py-8 text-center"
                        aria-label="Call to action for FLAM download"
                    >
                        <h2 className="bg-gradient-to-b from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))] py-4 bg-clip-text text-4xl font-medium font-heading tracking-tight text-transparent !leading-[1.15] md:text-7xl">
                            Transform your matatu experience today
                        </h2>
                        <p className="mt-6 text-[hsl(var(--muted-foreground))] max-w-md mx-auto text-lg">
                            Join thousands of commuters and operators who are already saving time and improving their
                            journeys with FLAM.
                        </p>
                        <div className="mt-6">
                            <Button asChild className="animate-wiggle">
                                <Link href="/download">
                                    Download FLAM now
                                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </AnimationContainer>
            </MaxWidthWrapper>
        </div>
    );
};

export default EnterprisePage;
