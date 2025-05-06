"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const components_1 = require("@/components");
const text_hover_effect_1 = require("@/components/ui/text-hover-effect");
const utils_1 = require("@/utils");
const Footer = ({ className }) => {
    return (<footer className={(0, utils_1.cn)('relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center border-t border-border bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 pb-8 pt-16 md:pb-0 lg:px-8 lg:pt-32', className)}>
            <div className="absolute left-1/2 right-1/2 top-0 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"></div>

            <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
                <components_1.AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-start justify-start md:max-w-[200px]">
                        <div className="flex items-start">
                            <components_1.Icons.logo className="h-7 w-7"/>
                        </div>
                        <p className="mt-4 text-start text-sm text-muted-foreground">Manage your links with ease.</p>
                        <span className="mt-4 flex items-center text-sm text-neutral-200">
                            Made by{' '}
                            <link_1.default href="https://sxcntcnqunts.com/" className="ml-1 font-semibold">
                                Shreyas
                            </link_1.default>
                        </span>
                    </div>
                </components_1.AnimationContainer>

                <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                    <div className="md:grid md:grid-cols-2 md:gap-8">
                        <components_1.AnimationContainer delay={0.2}>
                            <div className="">
                                <h3 className="text-base font-medium text-white">Product</h3>
                                <ul className="mt-4 text-sm text-muted-foreground">
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Features
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Pricing
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Testimonials
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Integration
                                        </link_1.default>
                                    </li>
                                </ul>
                            </div>
                        </components_1.AnimationContainer>
                        <components_1.AnimationContainer delay={0.3}>
                            <div className="mt-10 flex flex-col md:mt-0">
                                <h3 className="text-base font-medium text-white">Integrations</h3>
                                <ul className="mt-4 text-sm text-muted-foreground">
                                    <li className="">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Facebook
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Instagram
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            Twitter
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            LinkedIn
                                        </link_1.default>
                                    </li>
                                </ul>
                            </div>
                        </components_1.AnimationContainer>
                    </div>
                    <div className="md:grid md:grid-cols-2 md:gap-8">
                        <components_1.AnimationContainer delay={0.4}>
                            <div className="">
                                <h3 className="text-base font-medium text-white">Resources</h3>
                                <ul className="mt-4 text-sm text-muted-foreground">
                                    <li className="mt-2">
                                        <link_1.default href="/resources/blog" className="transition-all duration-300 hover:text-foreground">
                                            Blog
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="/resources/help" className="transition-all duration-300 hover:text-foreground">
                                            Support
                                        </link_1.default>
                                    </li>
                                </ul>
                            </div>
                        </components_1.AnimationContainer>
                        <components_1.AnimationContainer delay={0.5}>
                            <div className="mt-10 flex flex-col md:mt-0">
                                <h3 className="text-base font-medium text-white">Company</h3>
                                <ul className="mt-4 text-sm text-muted-foreground">
                                    <li className="">
                                        <link_1.default href="" className="transition-all duration-300 hover:text-foreground">
                                            About Us
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="/privacy" className="transition-all duration-300 hover:text-foreground">
                                            Privacy Policy
                                        </link_1.default>
                                    </li>
                                    <li className="mt-2">
                                        <link_1.default href="/terms" className="transition-all duration-300 hover:text-foreground">
                                            Terms & Conditions
                                        </link_1.default>
                                    </li>
                                </ul>
                            </div>
                        </components_1.AnimationContainer>
                    </div>
                </div>
            </div>

            <div className="mt-8 w-full border-t border-border/40 pt-4 md:flex md:items-center md:justify-between md:pt-8">
                <components_1.AnimationContainer delay={0.6}>
                    <p className="mt-8 text-sm text-muted-foreground md:mt-0">
                        © {new Date().getFullYear()} Sxcntqnt INC. All rights reserved.
                    </p>
                </components_1.AnimationContainer>
            </div>

            <div className="hidden h-[9rem] items-center justify-center md:flex lg:h-[9rem]">
                <text_hover_effect_1.TextHoverEffect text="SXCNTCNQUNT"/>
            </div>
        </footer>);
};
exports.default = Footer;
