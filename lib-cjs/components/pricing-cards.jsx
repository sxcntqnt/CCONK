"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const tabs_1 = require("@/components/ui/tabs");
const tooltip_1 = require("@/components/ui/tooltip");
const utils_1 = require("@/utils");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const PricingCards = () => {
    const MotionTabTrigger = (0, framer_motion_1.motion)(tabs_1.TabsTrigger);
    const [activeTab, setActiveTab] = (0, react_1.useState)('monthly');
    return (<tabs_1.Tabs defaultValue="monthly" className="flex w-full flex-col items-center justify-center">
            <tabs_1.TabsList>
                <MotionTabTrigger value="monthly" onClick={() => setActiveTab('monthly')} className="relative">
                    {activeTab === 'monthly' && (<framer_motion_1.motion.div layoutId="active-tab-indicator" transition={{
                type: 'spring',
                bounce: 0.5,
            }} className="absolute left-0 top-0 z-10 h-full w-full rounded-md bg-background shadow-sm"/>)}
                    <span className="z-20">Monthly</span>
                </MotionTabTrigger>
                <MotionTabTrigger value="yearly" onClick={() => setActiveTab('yearly')} className="relative">
                    {activeTab === 'yearly' && (<framer_motion_1.motion.div layoutId="active-tab-indicator" transition={{
                type: 'spring',
                bounce: 0.5,
            }} className="absolute left-0 top-0 z-10 h-full w-full rounded-md bg-background shadow-sm"/>)}
                    <span className="z-20">Yearly</span>
                </MotionTabTrigger>
            </tabs_1.TabsList>
            <tabs_1.TabsContent value="monthly" className="mx-auto grid w-full max-w-5xl grid-cols-1 flex-wrap gap-5 pt-6 md:gap-8 lg:grid-cols-3">
                {utils_1.PLANS.map((plan) => (<card_1.Card key={plan.name} className={(0, utils_1.cn)('flex w-full flex-col rounded-xl border-border', plan.name === 'Pro' && 'border-2 border-purple-500')}>
                        <card_1.CardHeader className={(0, utils_1.cn)('border-b border-border', plan.name === 'Pro' ? 'bg-purple-500/[0.07]' : 'bg-foreground/[0.03]')}>
                            <card_1.CardTitle className={(0, utils_1.cn)(plan.name !== 'Pro' && 'text-muted-foreground', 'text-lg font-medium')}>
                                {plan.name}
                            </card_1.CardTitle>
                            <card_1.CardDescription>{plan.info}</card_1.CardDescription>
                            <h5 className="text-3xl font-semibold">
                                ${plan.price.monthly}
                                <span className="text-base font-normal text-muted-foreground">
                                    {plan.name !== 'Free' ? '/month' : ''}
                                </span>
                            </h5>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-4 pt-6">
                            {plan.features.map((feature, index) => (<div key={index} className="flex items-center gap-2">
                                    <lucide_react_1.CheckCircleIcon className="h-4 w-4 text-purple-500"/>
                                    <tooltip_1.TooltipProvider>
                                        <tooltip_1.Tooltip delayDuration={0}>
                                            <tooltip_1.TooltipTrigger asChild>
                                                <p className={(0, utils_1.cn)(feature.tooltip &&
                    'cursor-pointer border-b !border-dashed border-border')}>
                                                    {feature.text}
                                                </p>
                                            </tooltip_1.TooltipTrigger>
                                            {feature.tooltip && (<tooltip_1.TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </tooltip_1.TooltipContent>)}
                                        </tooltip_1.Tooltip>
                                    </tooltip_1.TooltipProvider>
                                </div>))}
                        </card_1.CardContent>
                        <card_1.CardFooter className="mt-auto w-full">
                            <link_1.default href={plan.btn.href} style={{ width: '100%' }} className={(0, button_1.buttonVariants)({
                className: plan.name === 'Pro' && 'bg-purple-500 text-white hover:bg-purple-500/80',
            })}>
                                {plan.btn.text}
                            </link_1.default>
                        </card_1.CardFooter>
                    </card_1.Card>))}
            </tabs_1.TabsContent>
            <tabs_1.TabsContent value="yearly" className="mx-auto grid w-full max-w-5xl grid-cols-1 flex-wrap gap-5 pt-6 md:gap-8 lg:grid-cols-3">
                {utils_1.PLANS.map((plan) => (<card_1.Card key={plan.name} className={(0, utils_1.cn)('flex w-full flex-col rounded-xl border-border', plan.name === 'Pro' && 'border-2 border-purple-500')}>
                        <card_1.CardHeader className={(0, utils_1.cn)('border-b border-border', plan.name === 'Pro' ? 'bg-purple-500/[0.07]' : 'bg-foreground/[0.03]')}>
                            <card_1.CardTitle className={(0, utils_1.cn)(plan.name !== 'Pro' && 'text-muted-foreground', 'text-lg font-medium')}>
                                {plan.name}
                            </card_1.CardTitle>
                            <card_1.CardDescription>{plan.info}</card_1.CardDescription>
                            <h5 className="flex items-end text-3xl font-semibold">
                                ${plan.price.yearly}
                                <div className="text-base font-normal text-muted-foreground">
                                    {plan.name !== 'Free' ? '/year' : ''}
                                </div>
                                {plan.name !== 'Free' && (<framer_motion_1.motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3, type: 'spring', bounce: 0.25 }} className="ml-2 rounded-md bg-purple-500 px-2 py-0.5 text-sm font-medium text-foreground">
                                        -12%
                                    </framer_motion_1.motion.span>)}
                            </h5>
                        </card_1.CardHeader>
                        <card_1.CardContent className="space-y-4 pt-6">
                            {plan.features.map((feature, index) => (<div key={index} className="flex items-center gap-2">
                                    <lucide_react_1.CheckCircleIcon className="h-4 w-4 text-purple-500"/>
                                    <tooltip_1.TooltipProvider>
                                        <tooltip_1.Tooltip delayDuration={0}>
                                            <tooltip_1.TooltipTrigger asChild>
                                                <p className={(0, utils_1.cn)(feature.tooltip &&
                    'cursor-pointer border-b !border-dashed border-border')}>
                                                    {feature.text}
                                                </p>
                                            </tooltip_1.TooltipTrigger>
                                            {feature.tooltip && (<tooltip_1.TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </tooltip_1.TooltipContent>)}
                                        </tooltip_1.Tooltip>
                                    </tooltip_1.TooltipProvider>
                                </div>))}
                        </card_1.CardContent>
                        <card_1.CardFooter className="pt- mt-auto w-full">
                            <link_1.default href={plan.btn.href} style={{ width: '100%' }} className={(0, button_1.buttonVariants)({
                className: plan.name === 'Pro' && 'bg-purple-500 text-white hover:bg-purple-500/80',
            })} legacyBehavior>
                                {plan.btn.text}
                            </link_1.default>
                        </card_1.CardFooter>
                    </card_1.Card>))}
            </tabs_1.TabsContent>
        </tabs_1.Tabs>);
};
exports.default = PricingCards;
