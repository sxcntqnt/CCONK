"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const accordion_1 = require("@/components/ui/accordion");
const magic_badge_1 = __importDefault(require("@/components/ui/magic-badge"));
const faq_1 = require("@/utils/constants/faq");
const PricingPage = () => {
    return (<components_1.MaxWidthWrapper className="mb-40">
            <components_1.AnimationContainer delay={0.1}>
                <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-10">
                    <magic_badge_1.default>Pricing</magic_badge_1.default>
                    <h1 className="mt-6 text-center font-heading text-2xl font-semibold !leading-tight md:text-4xl lg:text-5xl">
                        Simple and transparent pricing
                    </h1>
                    <p className="mt-6 text-center text-base text-muted-foreground md:text-lg">
                        Choose a plan that works for you. No hidden fees. No surprises.
                    </p>
                </div>
            </components_1.AnimationContainer>

            <components_1.AnimationContainer delay={0.2}>
                <components_1.PricingCards />
            </components_1.AnimationContainer>

            <components_1.AnimationContainer delay={0.3}>
                <div className="mt-20 w-full">
                    <div className="flex w-full flex-col items-center justify-center pt-12">
                        <h2 className="mt-6 text-center text-2xl font-semibold lg:text-3xl xl:text-4xl">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-6 max-w-lg text-center text-neutral-500">
                            Here are some of the most common questions we get asked. If you have a question that
                            isn&apos;t answered here, feel free to reach out to us.
                        </p>
                    </div>
                    <div className="mx-auto mt-20 w-full max-w-3xl">
                        <accordion_1.Accordion type="single" collapsible>
                            {faq_1.FAQ.map((faq) => (<accordion_1.AccordionItem key={faq.id} value={faq.id}>
                                    <accordion_1.AccordionTrigger>{faq.question}</accordion_1.AccordionTrigger>
                                    <accordion_1.AccordionContent>{faq.answer}</accordion_1.AccordionContent>
                                </accordion_1.AccordionItem>))}
                        </accordion_1.Accordion>
                    </div>
                </div>
            </components_1.AnimationContainer>
        </components_1.MaxWidthWrapper>);
};
exports.default = PricingPage;
