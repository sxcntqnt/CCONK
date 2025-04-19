import { AnimationContainer, MaxWidthWrapper, PricingCards } from '@/components';
import { BentoCard, BentoGrid, CARDS } from '@/components/ui/bento-grid';
import { BorderBeam } from '@/components/ui/border-beam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LampContainer } from '@/components/ui/lamp';
import MagicBadge from '@/components/ui/magic-badge';
import MagicCard from '@/components/ui/magic-card';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRightIcon, CreditCardIcon, StarIcon } from 'lucide-react';
import { SewingPinIcon, BellIcon, BarChartIcon } from '@radix-ui/react-icons';
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { FLAM_FEATURES, TESTIMONIALS, MATATU_PARTNERS, FLAM_USE_CASES } from '@/utils/constants/misc';

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

// Simplified badge component to replace MagicBadge
const Badge = ({ title }: { title: string }) => (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        {title}
    </span>
);
const EnterprisePage = async () => {
    const user = await currentUser();

    return (
        <div className="overflow-x-hidden scrollbar-hide size-full">
            {/* Hero Section */}
            <MaxWidthWrapper>
                <div className="flex flex-col items-center justify-center w-full text-center bg-gradient-to-t from-[hsl(var(--background))]">
                    <AnimationContainer className="flex flex-col items-center justify-center w-full text-center">
                        <button
                            className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200"
                            aria-label="Announcement: Now live in Nairobi"
                        >
                            <span>
                                <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
                            </span>
                            <span className="backdrop absolute inset-[1px] rounded-full bg-[hsl(var(--card))] transition-colors duration-200 group-hover:bg-[hsl(var(--card)/0.9)]" />
                            <span className="h-full w-full blur-md absolute bottom-0 inset-x-0 bg-gradient-to-tr from-[hsl(var(--primary)/0.2)]" />
                            <span className="z-10 py-0.5 text-sm text-[hsl(var(--foreground))] flex items-center justify-center gap-1">
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
                        <div className="mt-12 rounded-[var(--border-radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.5)] p-2 backdrop-blur-sm">
                            <Image
                                src="/assets/dashboard-dark.svg"
                                alt="FLAM Dashboard showing live matatu tracking"
                                width={1200}
                                height={1200}
                                quality={100}
                                className="rounded-[var(--border-radius-md)]"
                            />
                        </div>
                    </AnimationContainer>
                </div>
            </MaxWidthWrapper>

            {/* Partners Section */}
            <MaxWidthWrapper className="py-12">
                <div className="text-center">
                    <h2 className="text-sm font-medium uppercase text-muted-foreground">
                        Trusted by leading matatu operators across Nairobi
                    </h2>
                    <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 md:gap-x-12">
                        {MATATU_PARTNERS.map((partner) => (
                            <li key={partner.name}>
                                <Image
                                    src={partner.logo}
                                    alt={partner.name}
                                    width={80}
                                    height={80}
                                    quality={100}
                                    className="h-auto w-24"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </MaxWidthWrapper>

            {/* Features Section */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Features" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        Smart Matatu Management For Everyone
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        FLAM is a powerful fleet management platform that helps commuters save time and operators
                        improve service.
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {FLAM_FEATURES.map((feature, idx) => (
                        <Card key={idx} className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <feature.Icon className="h-8 w-8 text-primary" />
                                <CardTitle>{feature.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* Process Section */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="How It Works" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        Transform your commute in 3 simple steps
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Getting started with FLAM is quick and easy, putting real-time matatu information at your
                        fingertips.
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {FLAM_PROCESS.map((process, id) => (
                        <Card key={id} className="relative transition-shadow hover:shadow-lg">
                            <span className="absolute -top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-lg font-medium text-foreground">
                                {id + 1}
                            </span>
                            <CardHeader>
                                <process.icon className="h-10 w-10 text-foreground" />
                                <CardTitle>{process.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{process.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* Pricing Section */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Flexible Plans" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        Plans for commuters and operators
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Start with our free plan and upgrade to premium features as your needs grow.
                    </p>
                </div>
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                            <CardDescription>Contact us for detailed pricing plans</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
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
                <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <svg
                            className="h-5 w-5 text-foreground"
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
            </MaxWidthWrapper>

            {/* Testimonials Section */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Success Stories" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        What our users are saying
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Here's what commuters and operators have to say about FLAM.
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <Card key={index} className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                                <CardDescription>{testimonial.userType}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{testimonial.testimony}</p>
                            </CardContent>
                            <CardFooter className="space-x-1">
                                {Array.from({ length: testimonial.rating }, (_, i) => (
                                    <StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                ))}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* Use Cases Section */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Real World Impact" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        FLAM in action
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Discover how FLAM is transforming public transportation in Nairobi.
                    </p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {FLAM_USE_CASES.map((useCase, index) => (
                        <Card key={index} className="flex flex-col transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <useCase.icon className="h-12 w-12 text-primary" />
                                <CardTitle>{useCase.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{useCase.description}</p>
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
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* CTA Section */}
            <MaxWidthWrapper className="py-16">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                        Transform your matatu experience today
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-md">
                        Join thousands of commuters and operators who are already saving time and improving their
                        journeys with FLAM.
                    </p>
                    <div className="mt-6">
                        <Button>
                            Download FLAM now
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </MaxWidthWrapper>
        </div>
    );
};

export default EnterprisePage;
