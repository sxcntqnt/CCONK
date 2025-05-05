"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/(marketing)/page.tsx
const components_1 = require("@/components");
const bentogrid_1 = require("@/components/ui/bentogrid");
const border_beam_1 = require("@/components/ui/border-beam");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lamp_1 = require("@/components/ui/lamp");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const magic_card_1 = __importDefault(require("@/components/ui/magic-card"));
const utils_1 = require("@/utils");
const misc_1 = require("@/utils/constants/misc");
const server_1 = require("@clerk/nextjs/server");
const lucide_react_1 = require("lucide-react");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const HomePage = async () => {
    const user = await (0, server_1.currentUser)();
    return (<div className="size-full overflow-x-hidden scrollbar-hide">
            {/* Hero Section */}
            <components_1.MaxWidthWrapper>
                <div className="flex w-full flex-col items-center justify-center bg-gradient-to-t from-background text-center">
                    <components_1.AnimationContainer className="flex w-full flex-col items-center justify-center text-center">
                        <button className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200">
                            <span>
                                <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]"/>
                            </span>
                            <span className="backdrop absolute inset-[1px] rounded-full bg-neutral-950 transition-colors duration-200 group-hover:bg-neutral-900"/>
                            <span className="absolute inset-x-0 bottom-0 h-full w-full bg-gradient-to-tr from-primary/20 blur-md"></span>
                            <span className="z-10 flex items-center justify-center gap-1 py-0.5 text-sm text-neutral-100">
                                ✨ Manage links smarter
                                <lucide_react_1.ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"/>
                            </span>
                        </button>
                        <h1 className="w-full text-balance py-6 text-center font-heading text-5xl font-medium !leading-[1.15] tracking-normal text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
                            Smart Links with{' '}
                            <span className="inline-block bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                                Precision
                            </span>
                        </h1>
                        <p className="mb-12 text-balance text-lg tracking-tight text-muted-foreground md:text-xl">
                            Effortlessly streamline your link management with Linkify.
                            <br className="hidden md:block"/>
                            <span className="hidden md:block">
                                Shorten, track, and organize all your links in one place.
                            </span>
                        </p>
                        <div className="z-50 flex items-center justify-center gap-4 whitespace-nowrap">
                            <button_1.Button asChild>
                                <link_1.default href={user ? '/dashboard' : '/auth/sign-in'}>
                                    <span className="flex items-center">
                                        Start creating for free
                                        <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                    </span>
                                </link_1.default>
                            </button_1.Button>
                        </div>
                    </components_1.AnimationContainer>

                    <components_1.AnimationContainer delay={0.2} className="relative w-full bg-transparent px-2 pb-20 pt-20 md:py-32">
                        <div className="gradient absolute inset-0 left-1/2 h-1/4 w-3/4 -translate-x-1/2 animate-image-glow blur-[5rem] md:top-[10%] md:h-1/3"></div>
                        <div className="-m-2 rounded-xl bg-opacity-50 p-2 ring-1 ring-inset ring-foreground/20 backdrop-blur-3xl lg:-m-4 lg:rounded-2xl">
                            <border_beam_1.BorderBeam size={250} duration={12} delay={9}/>
                            <image_1.default src="/assets/dashboard-dark.svg" alt="Dashboard" width={1200} height={1200} quality={100} className="rounded-md bg-foreground/10 ring-1 ring-border lg:rounded-xl"/>
                            <div className="absolute inset-x-0 -bottom-4 z-40 h-1/2 w-full bg-gradient-to-t from-background"></div>
                            <div className="absolute inset-x-0 bottom-0 z-50 h-1/4 w-full bg-gradient-to-t from-background md:-bottom-8"></div>
                        </div>
                    </components_1.AnimationContainer>
                </div>
            </components_1.MaxWidthWrapper>
            {/* Companies Section */}
            <components_1.MaxWidthWrapper>
                <components_1.AnimationContainer delay={0.4}>
                    <div className="py-14">
                        <div className="mx-auto px-4 md:px-8">
                            <h2 className="text-center font-heading text-sm font-medium uppercase text-neutral-400">
                                Trusted by the best in the industry
                            </h2>
                            <div className="mt-8">
                                <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-6 md:gap-x-16">
                                    {utils_1.COMPANIES.map((company) => (<li key={company.name}>
                                            <image_1.default src={company.logo} alt={company.name} width={80} height={80} quality={100} className="h-auto w-28"/>
                                        </li>))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
            {/* Features Section */}
            <components_1.MaxWidthWrapper className="pt-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex w-full flex-col items-center justify-center py-8 lg:items-center">
                        <magic_badge_1.default>Features</magic_badge_1.default>
                        <h2 className="mt-6 text-center font-heading text-3xl font-medium !leading-[1.1] text-foreground md:text-5xl lg:text-center">
                            Manage Links Like a Pro
                        </h2>
                        <p className="mt-4 max-w-lg text-center text-lg text-muted-foreground lg:text-center">
                            Linkify is a powerful link management tool that helps you shorten, track, and organize all
                            your links in one place.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.2}>
                    <bentogrid_1.BentoGrid className="py-8">
                        {bentogrid_1.CARDS.map((feature, idx) => (<bentogrid_1.BentoCard key={idx} {...feature}/>))}
                    </bentogrid_1.BentoGrid>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
            {/* Process Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-8 lg:items-center">
                        <magic_badge_1.default>The Process</magic_badge_1.default>
                        <h2 className="mt-6 text-center font-heading text-3xl font-medium !leading-[1.1] text-foreground md:text-5xl lg:text-center">
                            Effortless link management in 3 steps
                        </h2>
                        <p className="mt-4 max-w-lg text-center text-lg text-muted-foreground lg:text-center">
                            Follow these simple steps to optimize, organize, and share your links with ease.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <div className="grid w-full grid-cols-1 gap-4 py-8 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                    {utils_1.PROCESS.map((process, id) => (<components_1.AnimationContainer delay={0.2 * id} key={id}>
                            <magic_card_1.default className="group md:py-8">
                                <div className="flex w-full flex-col items-start justify-center">
                                    <process.icon strokeWidth={1.5} className="h-10 w-10 text-foreground"/>
                                    <div className="relative flex flex-col items-start">
                                        <span className="absolute -top-6 right-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border pt-0.5 text-2xl font-medium text-foreground">
                                            {id + 1}
                                        </span>
                                        <h3 className="mt-6 text-base font-medium text-foreground">{process.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{process.description}</p>
                                    </div>
                                </div>
                            </magic_card_1.default>
                        </components_1.AnimationContainer>))}
                </div>
            </components_1.MaxWidthWrapper>
            {/* Pricing Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-8 lg:items-center">
                        <magic_badge_1.default>Simple Pricing</magic_badge_1.default>
                        <h2 className="mt-6 text-center font-heading text-3xl font-medium !leading-[1.1] text-foreground md:text-5xl lg:text-center">
                            Choose a plan that works for you
                        </h2>
                        <p className="mt-4 max-w-lg text-center text-lg text-muted-foreground lg:text-center">
                            Get started with Linkify today and enjoy more features with our pro plans.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.2}>
                    <components_1.PricingCards />
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.3}>
                    <div className="mx-auto mt-12 flex w-full max-w-5xl flex-wrap items-start justify-center gap-6 md:items-center lg:justify-evenly">
                        <div className="flex items-center gap-2">
                            <lucide_react_1.CreditCardIcon className="h-5 w-5 text-foreground"/>
                            <span className="text-muted-foreground">No credit card required</span>
                        </div>
                    </div>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
            {/* Reviews Section */}
            <components_1.MaxWidthWrapper className="py-10">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center py-8 lg:items-center">
                        <magic_badge_1.default>Our Customers</magic_badge_1.default>
                        <h2 className="mt-6 text-center font-heading text-3xl font-medium !leading-[1.1] text-foreground md:text-5xl lg:text-center">
                            What our users are saying
                        </h2>
                        <p className="mt-4 max-w-lg text-center text-lg text-muted-foreground lg:text-center">
                            Here&apos;s what some of our users have to say about Linkify.
                        </p>
                    </div>
                </components_1.AnimationContainer>
                <div className="grid grid-cols-1 place-items-start gap-4 py-10 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                    <div className="flex h-min flex-col items-start gap-6">
                        {misc_1.REVIEWS.slice(0, 3).map((review, index) => (<components_1.AnimationContainer delay={0.2 * index} key={index}>
                                <magic_card_1.default key={index} className="md:p-0">
                                    <card_1.Card className="flex h-min w-full flex-col border-none">
                                        <card_1.CardHeader className="space-y-0">
                                            <card_1.CardTitle className="text-lg font-medium text-muted-foreground">
                                                {review.name}
                                            </card_1.CardTitle>
                                            <card_1.CardDescription>{review.username}</card_1.CardDescription>
                                        </card_1.CardHeader>
                                        <card_1.CardContent className="space-y-4 pb-4">
                                            <p className="text-muted-foreground">{review.review}</p>
                                        </card_1.CardContent>
                                        <card_1.CardFooter className="mt-auto w-full space-x-1">
                                            {Array.from({ length: review.rating }, (_, i) => (<lucide_react_1.StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500"/>))}
                                        </card_1.CardFooter>
                                    </card_1.Card>
                                </magic_card_1.default>
                            </components_1.AnimationContainer>))}
                    </div>
                    <div className="flex h-min flex-col items-start gap-6">
                        {misc_1.REVIEWS.slice(3, 6).map((review, index) => (<components_1.AnimationContainer delay={0.2 * index} key={index}>
                                <magic_card_1.default key={index} className="md:p-0">
                                    <card_1.Card className="flex h-min w-full flex-col border-none">
                                        <card_1.CardHeader className="space-y-0">
                                            <card_1.CardTitle className="text-lg font-medium text-muted-foreground">
                                                {review.name}
                                            </card_1.CardTitle>
                                            <card_1.CardDescription>{review.username}</card_1.CardDescription>
                                        </card_1.CardHeader>
                                        <card_1.CardContent className="space-y-4 pb-4">
                                            <p className="text-muted-foreground">{review.review}</p>
                                        </card_1.CardContent>
                                        <card_1.CardFooter className="mt-auto w-full space-x-1">
                                            {Array.from({ length: review.rating }, (_, i) => (<lucide_react_1.StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500"/>))}
                                        </card_1.CardFooter>
                                    </card_1.Card>
                                </magic_card_1.default>
                            </components_1.AnimationContainer>))}
                    </div>
                    <div className="flex h-min flex-col items-start gap-6">
                        {misc_1.REVIEWS.slice(6, 9).map((review, index) => (<components_1.AnimationContainer delay={0.2 * index} key={index}>
                                <magic_card_1.default key={index} className="md:p-0">
                                    <card_1.Card className="flex h-min w-full flex-col border-none">
                                        <card_1.CardHeader className="space-y-0">
                                            <card_1.CardTitle className="text-lg font-medium text-muted-foreground">
                                                {review.name}
                                            </card_1.CardTitle>
                                            <card_1.CardDescription>{review.username}</card_1.CardDescription>
                                        </card_1.CardHeader>
                                        <card_1.CardContent className="space-y-4 pb-4">
                                            <p className="text-muted-foreground">{review.review}</p>
                                        </card_1.CardContent>
                                        <card_1.CardFooter className="mt-auto w-full space-x-1">
                                            {Array.from({ length: review.rating }, (_, i) => (<lucide_react_1.StarIcon key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500"/>))}
                                        </card_1.CardFooter>
                                    </card_1.Card>
                                </magic_card_1.default>
                            </components_1.AnimationContainer>))}
                    </div>
                </div>
            </components_1.MaxWidthWrapper>
            {/* CTA Section */}
            <components_1.MaxWidthWrapper className="mt-20 max-w-[100vw] overflow-x-hidden scrollbar-hide">
                <components_1.AnimationContainer delay={0.1}>
                    <lamp_1.LampContainer>
                        <div className="relative flex w-full flex-col items-center justify-center text-center">
                            <h2 className="mt-8 bg-gradient-to-b from-neutral-200 to-neutral-400 bg-clip-text py-4 text-center font-heading text-4xl font-medium !leading-[1.15] tracking-tight text-transparent md:text-7xl">
                                Step into the future of link management
                            </h2>
                            <p className="mx-auto mt-6 max-w-md text-muted-foreground">
                                Experience the cutting-edge solution that transforms how you handle your links. Elevate
                                your online presence with our next-gen platform.
                            </p>
                            <div className="mt-6">
                                <button_1.Button>
                                    Get started for free
                                    <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                </button_1.Button>
                            </div>
                        </div>
                    </lamp_1.LampContainer>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
        </div>);
};
exports.default = HomePage;
