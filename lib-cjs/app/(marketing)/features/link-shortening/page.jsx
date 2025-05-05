"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const button_1 = require("@/components/ui/button");
const lamp_1 = require("@/components/ui/lamp");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const utils_1 = require("@/utils");
const lucide_react_1 = require("lucide-react");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const LinkShorteningPage = () => {
    return (<>
            <components_1.MaxWidthWrapper>
                <components_1.AnimationContainer delay={0.1} className="w-full">
                    <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-10">
                        <magic_badge_1.default>Simple"</magic_badge_1.default>
                        <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                            Shorten links and track their performance
                        </h1>
                        <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">
                            Simplify your workflow with powerful link management tools. Shorten links, track clicks, and
                            optimize your strategy with ease.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-x-4">
                            <button_1.Button size="sm" asChild>
                                <link_1.default href="/dashboard">Get started</link_1.default>
                            </button_1.Button>
                            <button_1.Button size="sm" variant="outline" asChild>
                                <link_1.default href="/blog">Learn more</link_1.default>
                            </button_1.Button>
                        </div>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.2} className="w-full">
                    <div className="mx-auto flex w-full max-w-4xl py-10">
                        <image_1.default src="/assets/shorten-links.svg" alt="Shorten links and track their performance" width={80} height={80} className="h-auto w-full"/>
                    </div>
                </components_1.AnimationContainer>
                <components_1.AnimationContainer delay={0.3} className="w-full">
                    <div className="py-14">
                        <div className="mx-auto px-4 md:px-8">
                            <h2 className="text-center font-heading text-sm font-medium uppercase text-neutral-400">
                                Trusted by the best in the industry
                            </h2>
                            <div className="mt-8">
                                <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-6 py-8 md:gap-x-16">
                                    {utils_1.COMPANIES.map((company) => (<li key={company.name}>
                                            <image_1.default src={company.logo} alt={company.name} width={80} height={80} quality={100} className="h-auto w-28"/>
                                        </li>))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
            <components_1.MaxWidthWrapper className="pt-20">
                <components_1.AnimationContainer delay={0.4} className="w-full">
                    <lamp_1.LampContainer className="mx-auto max-w-2xl">
                        <div className="relative flex w-full flex-col items-center justify-center text-center">
                            <h2 className="mt-8 bg-gradient-to-br from-neutral-300 to-neutral-500 bg-clip-text py-4 text-center font-heading text-4xl font-semibold tracking-tight text-transparent md:text-7xl">
                                Powerup your link strategy
                            </h2>
                            <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
                                Take control of your links with advanced features and real-time insights. Simplify your
                                workflow and achieve more.
                            </p>
                            <div className="mt-6">
                                <button_1.Button asChild>
                                    <link_1.default href="/auth/sign-up" className="flex items-center" legacyBehavior>
                                        Get started for free
                                        <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                    </link_1.default>
                                </button_1.Button>
                            </div>
                        </div>
                    </lamp_1.LampContainer>
                </components_1.AnimationContainer>
            </components_1.MaxWidthWrapper>
        </>);
};
exports.default = LinkShorteningPage;
