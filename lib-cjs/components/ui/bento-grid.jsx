"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BentoGrid = exports.BentoCard = exports.CARDS = void 0;
const button_1 = require("@/components/ui/button");
const command_1 = require("@/components/ui/command");
const utils_1 = require("@/utils");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("./card");
const input_1 = require("./input");
const label_1 = require("./label");
const integrations_1 = require("./integrations");
exports.CARDS = [
    {
        Icon: lucide_react_1.MapIcon,
        name: 'Real-Time Tracking',
        description: 'Track matatus in real-time with accurate GPS positioning and arrival estimates.',
        href: '/features/tracking',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (<card_1.Card className="absolute left-10 top-10 origin-top rounded-none rounded-tl-md border border-r-0 border-[hsl(var(--border))] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105">
                <card_1.CardHeader>
                    <card_1.CardTitle>Track Your Matatu</card_1.CardTitle>
                    <card_1.CardDescription>Get real-time updates on your matatu's location.</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="-mt-4">
                    <label_1.Label>Find your route</label_1.Label>
                    <input_1.Input type="text" placeholder="Enter route number or destination..." className="w-full focus-visible:ring-0 focus-visible:ring-transparent"/>
                </card_1.CardContent>
            </card_1.Card>),
    },
    {
        Icon: lucide_react_1.MapPinIcon,
        name: 'Route Optimization',
        description: 'Get the best routes based on traffic conditions and your preferences.',
        href: '/features/optimization',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (<command_1.Command className="origin-to absolute right-10 top-10 w-[70%] translate-x-0 border border-[hsl(var(--border))] p-2 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10">
                <input_1.Input placeholder="Where to?"/>
                <div className="mt-1 cursor-pointer">
                    <div className="rounded-md px-4 py-2 hover:bg-[hsl(var(--muted))]">Route 42 - CBD to Westlands</div>
                    <div className="rounded-md px-4 py-2 hover:bg-[hsl(var(--muted))]">
                        Route 23 - Eastlands Express
                    </div>
                    <div className="rounded-md px-4 py-2 hover:bg-[hsl(var(--muted))]">Route 87 - Southern Bypass</div>
                    <div className="rounded-md px-4 py-2 hover:bg-[hsl(var(--muted))]">Route 15 - Northern Circuit</div>
                    <div className="rounded-md px-4 py-2 hover:bg-[hsl(var(--muted))]">Route 32 - City Center Loop</div>
                </div>
            </command_1.Command>),
    },
    {
        Icon: lucide_react_1.SmartphoneIcon,
        name: 'User Interface',
        description: 'Intuitive mobile apps for Android and iOS with offline functionality.',
        href: '/features/mobile',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (<div className="absolute right-10 top-10 flex h-[300px] w-[70%] items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))/0.2] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105">
                <div className="flex space-x-4">
                    <div className="h-64 w-32 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))/0.3] shadow-lg"></div>
                    <div className="h-64 w-32 rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))/0.3] shadow-lg"></div>
                </div>
            </div>),
    },
    {
        Icon: lucide_react_1.BellIcon,
        name: 'Smart Notifications',
        description: 'Personalized alerts and predictive notifications based on your routines.',
        href: '/features/notifications',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (<card_1.Card className="absolute right-10 top-10 origin-top w-[70%] rounded-md border border-[hsl(var(--border))] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105">
                <card_1.CardHeader>
                    <card_1.CardTitle>Your Notifications</card_1.CardTitle>
                    <card_1.CardDescription>Stay informed about your journeys</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="-mt-4 space-y-2">
                    <div className="rounded-md bg-[hsl(var(--muted))/0.3] p-2 text-sm">
                        Route 42 will arrive in 5 minutes
                    </div>
                    <div className="rounded-md bg-[hsl(var(--muted))/0.3] p-2 text-sm">
                        Heavy traffic on your usual route - try Route 23
                    </div>
                    <div className="rounded-md bg-[hsl(var(--muted))/0.3] p-2 text-sm">
                        Morning commute: Matatu expected at 8:15 AM
                    </div>
                </card_1.CardContent>
            </card_1.Card>),
    },
    {
        Icon: lucide_react_1.BarChartIcon,
        name: 'Data Analytics',
        description: 'Advanced dashboards with trend analysis and demand forecasting for operators.',
        href: '/features/analytics',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (<div className="absolute right-2 top-4 h-[300px] w-[600px] border-none pl-28 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105 md:pl-0">
                <div className="flex h-full items-end space-x-4 px-10">
                    <div className="h-1/3 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-2/3 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-1/2 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-3/4 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-2/5 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-full w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                    <div className="h-3/5 w-16 rounded-t-md bg-[hsl(var(--primary))/0.7]"></div>
                </div>
            </div>),
    },
    {
        Icon: lucide_react_1.PlugIcon,
        name: 'Integrations',
        description: 'Seamlessly connect FLAM with your favorite apps like WhatsApp, Google Drive, and Notion.',
        href: '/integrations',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (<integrations_1.Integrations className="absolute right-2 top-4 h-[300px] w-[600px] border-none pl-28 md:pl-0 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105"/>),
    },
];
const BentoGrid = ({ children, className }) => {
    return (<div className={(0, utils_1.cn)('grid w-full auto-rows-[22rem] grid-cols-3 gap-4 min-w-0', className)} aria-label="FLAM feature grid">
            {children}
        </div>);
};
exports.BentoGrid = BentoGrid;
const BentoCard = ({ name, className, background, Icon, description, href, cta, }) => (<div key={name} className={(0, utils_1.cn)('group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border border-[hsl(var(--border))/0.6] animate-wiggle', 'bg-[hsl(var(--card))] [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]', className)}>
        <div>{background}</div>
        <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-12 w-12 origin-left text-[hsl(var(--foreground))] transition-all duration-300 ease-in-out group-hover:scale-75"/>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">{name}</h3>
            <p className="max-w-lg text-[hsl(var(--muted-foreground))]">{description}</p>
        </div>
        <div className={(0, utils_1.cn)('absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100')}>
            <link_1.default href={href} className={(0, utils_1.cn)((0, button_1.buttonVariants)({
        size: 'sm',
        variant: 'ghost',
    }), 'cursor-pointer flex items-center text-[hsl(var(--foreground))]')} aria-label={`Learn more about ${name}`}>
                {cta}
                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
            </link_1.default>
        </div>
        <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-[hsl(var(--card))/0.03]"/>
    </div>);
exports.BentoCard = BentoCard;
