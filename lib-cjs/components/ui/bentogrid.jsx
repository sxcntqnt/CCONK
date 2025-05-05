"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BentoGrid = exports.BentoCard = exports.CARDS = void 0;
const button_1 = require("@/components/ui/button");
const calendar_1 = require("@/components/ui/calendar");
const command_1 = require("@/components/ui/command");
const utils_1 = require("@/utils");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const card_1 = require("./card");
const input_1 = require("./input");
const integrations_1 = require("./integrations");
const label_1 = require("./label");
exports.CARDS = [
    {
        Icon: lucide_react_1.Link2Icon,
        name: 'Shorten links',
        description: 'Create short links that are easy to remember and share.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (<card_1.Card className="absolute top-10 left-10 origin-top rounded-none rounded-tl-md transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105 border border-border border-r-0">
                <card_1.CardHeader>
                    <card_1.CardTitle>Create short links</card_1.CardTitle>
                    <card_1.CardDescription>Create short links that are easy to remember and share.</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent className="-mt-4">
                    <label_1.Label>Paste your link</label_1.Label>
                    <input_1.Input type="text" placeholder="Paste your link here..." className="w-full focus-visible:ring-0 focus-visible:ring-transparent"/>
                </card_1.CardContent>
            </card_1.Card>),
    },
    {
        Icon: lucide_react_1.SearchIcon,
        name: 'Search your links',
        description: 'Quickly find the links you need with AI-powered search.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (<command_1.Command className="absolute right-10 top-10 w-[70%] origin-to translate-x-0 border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10 p-2">
                <input_1.Input placeholder="Type to search..."/>
                <div className="mt-1 cursor-pointer">
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/hdf00c</div>
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/sdv0n0</div>
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/03gndo</div>
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/09vmmw</div>
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/s09vws</div>
                    <div className="px-4 py-2 hover:bg-muted rounded-md">linkify.io/sd8fv5</div>
                </div>
            </command_1.Command>),
    },
    {
        Icon: lucide_react_1.WaypointsIcon,
        name: 'Connect your apps',
        description: 'Integrate with your favorite apps and services.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2 max-w-full overflow-hidden',
        background: (<integrations_1.Integrations className="absolute right-2 pl-28 md:pl-0 top-4 h-[300px] w-[600px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105"/>),
    },
    {
        Icon: lucide_react_1.CalendarIcon,
        name: 'Calendar',
        description: 'Keep track of your links with our calendar view.',
        className: 'col-span-3 lg:col-span-1',
        href: '#',
        cta: 'Learn more',
        background: (<calendar_1.Calendar mode="single" selected={new Date(2022, 4, 11, 0, 0, 0)} className="absolute right-0 top-10 origin-top rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"/>),
    },
];
const BentoGrid = ({ children, className }) => {
    return <div className={(0, utils_1.cn)('grid w-full auto-rows-[22rem] grid-cols-3 gap-4', className)}>{children}</div>;
};
exports.BentoGrid = BentoGrid;
const BentoCard = ({ name, className, background, Icon, description, href, cta, }) => (<div key={name} className={(0, utils_1.cn)('group relative col-span-3 flex flex-col justify-between border border-border/60 overflow-hidden rounded-xl', 'bg-black [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]', className)}>
        <div>{background}</div>
        <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-12 w-12 origin-left text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75"/>
            <h3 className="text-xl font-semibold text-neutral-300">{name}</h3>
            <p className="max-w-lg text-neutral-400">{description}</p>
        </div>

        <div className={(0, utils_1.cn)('absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100')}>
            <link_1.default href={href} className={(0, button_1.buttonVariants)({ size: 'sm', variant: 'ghost', className: 'cursor-pointer' })}>
                {cta}
                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
            </link_1.default>
        </div>
        <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"/>
    </div>);
exports.BentoCard = BentoCard;
