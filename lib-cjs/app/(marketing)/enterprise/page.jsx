"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLAM_PROCESS = void 0;
const components_1 = require("@/components");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const magic_card_1 = __importDefault(require("@/components/ui/magic-card"));
const lucide_react_1 = require("lucide-react");
const react_icons_1 = require("@radix-ui/react-icons");
const server_1 = require("@clerk/nextjs/server");
const link_1 = __importDefault(require("next/link"));
const misc_1 = require("@/utils/constants/misc");
const HeroSection_1 = __importDefault(require("@/components/ui/HeroSection"));
const PartnersSection_1 = __importDefault(require("@/components/ui/PartnersSection"));
const bento_grid_1 = require("@/components/ui/bento-grid");
// Define constants for reuse in other files
exports.FLAM_PROCESS = [
    {
        icon: react_icons_1.SewingPinIcon,
        title: 'Track Your Matatu',
        description: 'Enter your route and see real-time locations of all matatus on your selected path.',
    },
    {
        icon: react_icons_1.BarChartIcon,
        title: 'Optimize Your Journey',
        description: 'Get recommendations for fastest routes and estimated arrival times.',
    },
    {
        icon: react_icons_1.BellIcon,
        title: 'Stay Informed',
        description: 'Receive notifications about arrivals, delays, and changes to your usual routes.',
    },
];
const EnterprisePage = async () => {
    const user = await (0, server_1.currentUser)().catch(() => null);
    return (<div className="overflow-x-hidden scrollbar-hide size-full">
            {/* Hero Section */}
            <HeroSection_1.default user={user}/>

            {/* Partners Section */}
            <PartnersSection_1.default />

            {/* Features Section (with BentoGrid) */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <magic_badge_1.default>Features</magic_badge_1.default>
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Smart Matatu Management For Everyone
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            FLAM is a powerful fleet management platform that helps commuters save time and operators
                            improve service.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.2}>
                    <bento_grid_1.BentoGrid>
                        {bento_grid_1.CARDS.map((card, idx) => (<bento_grid_1.BentoCard key={idx} name={card.name} className={card.className} background={card.background} Icon={card.Icon} description={card.description} href={card.href} cta={card.cta}/>))}
                    </bento_grid_1.BentoGrid>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>

            {/* Process Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <magic_badge_1.default>How it Works</magic_badge_1.default>
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Transform your commute in 3 simple steps
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Getting started with FLAM is quick and easy, putting real-time matatu information at your
                            fingertips.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full py-8 gap-4 md:gap-8 min-w-0" aria-label="Steps to use FLAM for matatu management">
                    {exports.FLAM_PROCESS.map((process, id) => (<components_1.AnimationContainer delay={0.2 * id} key={id}>
                            <card_1.Card className="relative transition-shadow hover:shadow-lg animate-wiggle group md:py-8">
                                <span className="absolute -top-6 right-0 border-2 border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium text-2xl rounded-full w-12 h-12 flex items-center justify-center pt-0.5">
                                    {id + 1}
                                </span>
                                <card_1.CardHeader>
                                    <process.icon className="h-10 w-10 text-[hsl(var(--foreground))]" strokeWidth={1.5}/>
                                    <card_1.CardTitle>{process.title}</card_1.CardTitle>
                                </card_1.CardHeader>
                                <card_1.CardContent>
                                    <p className="text-[hsl(var(--muted-foreground))]">{process.description}</p>
                                </card_1.CardContent>
                            </card_1.Card>
                        </components_1.AnimationContainer>))}
                </div>
            </components_1.MaxWidthWrapper>

            {/* Pricing Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <magic_badge_1.default>Flexible Plans</magic_badge_1.default>
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            Plans for commuters and operators
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Start with our free plan and upgrade to premium features as your needs grow.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.2}>
                    <div className="mt-8 max-w-5xl mx-auto">
                        <card_1.Card className="animate-wiggle">
                            <card_1.CardHeader>
                                <card_1.CardTitle>Pricing</card_1.CardTitle>
                                <card_1.CardDescription>Contact us for detailed pricing plans</card_1.CardDescription>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                                <p className="text-[hsl(var(--muted-foreground))]">
                                    Flexible plans tailored for commuters and operators.
                                </p>
                            </card_1.CardContent>
                            <card_1.CardFooter>
                                <button_1.Button variant="outline" asChild>
                                    <link_1.default href="/pricing">Learn more</link_1.default>
                                </button_1.Button>
                            </card_1.CardFooter>
                        </card_1.Card>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.3}>
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-12 max-w-5xl mx-auto w-full" aria-label="Pricing benefits">
                        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                            <svg className="h-5 w-5 text-[hsl(var(--foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <span>Special discounts for fleet operators</span>
                        </div>
                    </div>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>

            {/* Testimonials Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <magic_badge_1.default>Success Stories</magic_badge_1.default>
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            What our users are saying
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Here's what commuters and operators have to say about FLAM.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-start gap-4 md:gap-8 py-10 min-w-0" aria-label="User testimonials for FLAM">
                    {misc_1.TESTIMONIALS.length > 0 ? (misc_1.TESTIMONIALS.map((testimonial, index) => (<components_1.AnimationContainer delay={0.2 * index} key={index}>
                                <magic_card_1.default className="md:p-0">
                                    <card_1.Card className="flex flex-col w-full border-none h-min transition-shadow hover:shadow-lg animate-wiggle">
                                        <card_1.CardHeader className="space-y-0">
                                            <card_1.CardTitle className="text-lg font-medium text-[hsl(var(--muted-foreground))]">
                                                {testimonial.name}
                                            </card_1.CardTitle>
                                            <card_1.CardDescription>{testimonial.userType}</card_1.CardDescription>
                                        </card_1.CardHeader>
                                        <card_1.CardContent className="space-y-4 pb-4">
                                            <p className="text-[hsl(var(--muted-foreground))]">
                                                {testimonial.testimony}
                                            </p>
                                        </card_1.CardContent>
                                        <card_1.CardFooter className="w-full space-x-1 mt-auto">
                                            {Array.from({ length: testimonial.rating }, (_, i) => (<lucide_react_1.StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500"/>))}
                                        </card_1.CardFooter>
                                    </card_1.Card>
                                </magic_card_1.default>
                            </components_1.AnimationContainer>))) : (<p className="text-center text-[hsl(var(--muted-foreground))]">No testimonials available</p>)}
                </div>
            </components_1.MaxWidthWrapper>

            {/* Use Cases Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 max-w-xl mx-auto text-center">
                        <magic_badge_1.default>Real World Impact</magic_badge_1.default>
                        <h2 className="mt-6 text-3xl font-medium font-heading text-[hsl(var(--foreground))] !leading-[1.1] md:text-5xl">
                            FLAM in action
                        </h2>
                        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-lg">
                            Discover how FLAM is transforming public transportation in Nairobi.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-10 min-w-0" aria-label="FLAM use cases for public transportation">
                    {misc_1.FLAM_USE_CASES.length > 0 ? (misc_1.FLAM_USE_CASES.map((useCase, index) => (<components_1.AnimationContainer delay={0.2 * index} key={index}>
                                <card_1.Card className="flex flex-col transition-shadow hover:shadow-lg animate-wiggle">
                                    <card_1.CardHeader>
                                        <useCase.icon className="h-12 w-12 text-[hsl(var(--primary))]"/>
                                        <card_1.CardTitle>{useCase.title}</card_1.CardTitle>
                                    </card_1.CardHeader>
                                    <card_1.CardContent className="flex-grow space-y-4 pb-4">
                                        <p className="text-[hsl(var(--muted-foreground))]">{useCase.description}</p>
                                    </card_1.CardContent>
                                    <card_1.CardFooter>
                                        <button_1.Button variant="outline" asChild>
                                            <link_1.default href={useCase.link}>
                                                Learn more
                                                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                            </link_1.default>
                                        </button_1.Button>
                                    </card_1.CardFooter>
                                </card_1.Card>
                            </components_1.AnimationContainer>))) : (<p className="text-center text-[hsl(var(--muted-foreground))]">No use cases available</p>)}
                </div>
            </components_1.MaxWidthWrapper>

            {/* CTA Section */}
            <components_1.MaxWidthWrapper className="py-10 mt-20 max-w-[100vw] overflow-x-hidden scrollbar-hide">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center justify-center py-8 text-center" aria-label="Call to action for FLAM download">
                        <h2 className="bg-gradient-to-b from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))] py-4 bg-clip-text text-4xl font-medium font-heading tracking-tight text-transparent !leading-[1.15] md:text-7xl">
                            Transform your matatu experience today
                        </h2>
                        <p className="mt-6 text-[hsl(var(--muted-foreground))] max-w-md mx-auto text-lg">
                            Join thousands of commuters and operators who are already saving time and improving their
                            journeys with FLAM.
                        </p>
                        <div className="mt-6">
                            <button_1.Button asChild className="animate-wiggle">
                                <link_1.default href="/download">
                                    Download FLAM now
                                    <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                </link_1.default>
                            </button_1.Button>
                        </div>
                    </div>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
        </div>);
};
exports.default = EnterprisePage;
