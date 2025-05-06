"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATION_CATEGORIES = void 0;
const alert_1 = require("@/components/ui/alert");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const lucide_react_1 = require("lucide-react");
const react_icons_1 = require("@radix-ui/react-icons");
const server_1 = require("@clerk/nextjs/server");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const integrations_1 = require("@/components/ui/integrations");
// Define constants for the integration categories
exports.INTEGRATION_CATEGORIES = [
    {
        title: 'Data Sources',
        description: 'Connect FLAM to various data providers to enhance tracking capabilities.',
        icon: lucide_react_1.ServerIcon,
        integrations: [
            { name: 'GPS Networks', description: 'Access real-time location data from major GPS providers.' },
            { name: 'Traffic APIs', description: 'Incorporate live traffic updates into route planning.' },
            { name: 'Weather Services', description: 'Get weather alerts that might affect matatu routes.' },
        ],
    },
    {
        title: 'Communication',
        description: 'Keep your team and passengers informed through multiple channels.',
        icon: lucide_react_1.PhoneIcon,
        integrations: [
            { name: 'WhatsApp', description: 'Send journey updates and arrival notifications via WhatsApp.' },
            { name: 'SMS Gateway', description: 'Automated text messages for passengers without smartphones.' },
            { name: 'Email Services', description: 'Daily reports and digests for fleet managers.' },
        ],
    },
    {
        title: 'Business Systems',
        description: 'Integrate with your existing business software for seamless operations.',
        icon: react_icons_1.MixerHorizontalIcon,
        integrations: [
            { name: 'Accounting Software', description: 'Sync fare collection data with your financial systems.' },
            { name: 'HR Management', description: 'Track driver schedules and performance metrics.' },
            { name: 'CRM Systems', description: 'Enhance customer relationships with journey history data.' },
        ],
    },
    {
        title: 'Cloud Services',
        description: 'Scale your fleet operations with powerful cloud integrations.',
        icon: lucide_react_1.CloudIcon,
        integrations: [
            { name: 'AWS', description: 'Leverage Amazon Web Services for robust backend infrastructure.' },
            { name: 'Google Cloud', description: 'Utilize Google Maps and other Google services seamlessly.' },
            { name: 'Azure', description: 'Microsoft Azure support for enterprise-level deployments.' },
        ],
    },
];
// Simple wrapper component to replace MaxWidthWrapper (reused from your page.tsx)
const MaxWidthWrapper = ({ children, className = '' }) => (<div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>);
// Simplified badge component (reused from your page.tsx)
const Badge = ({ title }) => (<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        {title}
    </span>);
const ChangeLogPage = async () => {
    const user = await (0, server_1.currentUser)();
    return (<div className="overflow-x-hidden">
            {/* Hero Section */}
            <MaxWidthWrapper className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                    <Badge title="Integrations"/>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                        Connect FLAM with your{' '}
                        <span className="text-transparent bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text">
                            favorite tools
                        </span>
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                        FLAM works seamlessly with the tools and services you already use. Extend your matatu tracking
                        capabilities with our powerful integration options.
                    </p>
                    <div className="mt-8 flex items-center gap-4">
                        <button_1.Button asChild>
                            <link_1.default href={user ? '/dashboard/integrations' : '/auth/sign-in'} className="flex items-center">
                                Explore integrations
                                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                            </link_1.default>
                        </button_1.Button>
                        <button_1.Button variant="outline" asChild>
                            <link_1.default href="/docs/api">API Documentation</link_1.default>
                        </button_1.Button>
                    </div>
                </div>
            </MaxWidthWrapper>

            {/* Interactive Integrations Demo */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center justify-center">
                    <integrations_1.Integrations className="mx-auto"/>
                    <p className="mt-6 text-center text-muted-foreground max-w-lg">
                        FLAM connects data from multiple sources through our central platform, delivering unified
                        insights to you and your passengers.
                    </p>
                </div>
            </MaxWidthWrapper>

            {/* Integration Categories */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Powerful Connections"/>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Integration Categories
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Extend FLAM's capabilities with our wide range of integration options, categorized for easy
                        discovery.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                    {exports.INTEGRATION_CATEGORIES.map((category, idx) => (<card_1.Card key={idx} className="transition-shadow hover:shadow-lg">
                            <card_1.CardHeader>
                                <div className="flex items-center gap-3">
                                    <category.icon className="h-8 w-8 text-primary"/>
                                    <card_1.CardTitle>{category.title}</card_1.CardTitle>
                                </div>
                                <card_1.CardDescription className="mt-2">{category.description}</card_1.CardDescription>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                                <ul className="space-y-4">
                                    {category.integrations.map((integration, i) => (<li key={i} className="flex gap-3">
                                            <react_icons_1.SewingPinIcon className="h-5 w-5 mt-0.5 text-primary"/>
                                            <div>
                                                <h4 className="font-medium">{integration.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {integration.description}
                                                </p>
                                            </div>
                                        </li>))}
                                </ul>
                            </card_1.CardContent>
                            <card_1.CardFooter>
                                <button_1.Button variant="outline" className="w-full" asChild>
                                    <link_1.default href={`/integrations/${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                                        View {category.title} Integrations
                                        <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                                    </link_1.default>
                                </button_1.Button>
                            </card_1.CardFooter>
                        </card_1.Card>))}
                </div>
            </MaxWidthWrapper>

            {/* Featured Integration */}
            <MaxWidthWrapper className="py-12">
                <div className="bg-accent/50 rounded-xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <Badge title="Featured Integration"/>
                        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            Seamless Google Maps Integration
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            Connect FLAM with Google Maps to enhance route visualization, optimize journeys, and provide
                            familiar map interfaces to your users.
                        </p>
                        <ul className="mt-6 space-y-3">
                            <li className="flex items-start gap-2">
                                <react_icons_1.RocketIcon className="h-5 w-5 mt-0.5 text-primary"/>
                                <span>Real-time route visualization on Google Maps interface</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <react_icons_1.RocketIcon className="h-5 w-5 mt-0.5 text-primary"/>
                                <span>Accurate ETAs using Google's traffic predictions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <react_icons_1.RocketIcon className="h-5 w-5 mt-0.5 text-primary"/>
                                <span>Points of interest along matatu routes</span>
                            </li>
                        </ul>
                        <button_1.Button className="mt-6" asChild>
                            <link_1.default href="/integrations/google-maps">
                                Learn More
                                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                            </link_1.default>
                        </button_1.Button>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-full max-w-sm h-64 md:h-80">
                            <image_1.default src="/api/placeholder/400/320" alt="Google Maps Integration" fill className="object-cover rounded-lg shadow-lg" quality={100}/>
                        </div>
                    </div>
                </div>
            </MaxWidthWrapper>

            {/* Integration Steps */}
            <MaxWidthWrapper className="py-12">
                <div className="flex flex-col items-center text-center">
                    <Badge title="Easy Setup"/>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Integrate in minutes, not days
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                        Setting up integrations with FLAM is straightforward and developer-friendly.
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {[
            {
                title: 'Select an Integration',
                description: 'Browse our catalog of available integrations and select the ones that fit your needs.',
                icon: react_icons_1.MixerHorizontalIcon,
            },
            {
                title: 'Authenticate & Configure',
                description: 'Follow our step-by-step guide to connect your accounts and configure settings.',
                icon: react_icons_1.SewingPinIcon,
            },
            {
                title: 'Start Using',
                description: 'Once connected, your integration is live and ready to enhance your FLAM experience.',
                icon: react_icons_1.RocketIcon,
            },
        ].map((step, id) => (<card_1.Card key={id} className="relative transition-shadow hover:shadow-lg">
                            <span className="absolute -top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-lg font-medium text-foreground">
                                {id + 1}
                            </span>
                            <card_1.CardHeader>
                                <step.icon className="h-10 w-10 text-foreground"/>
                                <card_1.CardTitle>{step.title}</card_1.CardTitle>
                            </card_1.CardHeader>
                            <card_1.CardContent>
                                <p className="text-muted-foreground">{step.description}</p>
                            </card_1.CardContent>
                        </card_1.Card>))}
                </div>
            </MaxWidthWrapper>

            {/* Developer Resources */}
            <MaxWidthWrapper className="py-12">
                <alert_1.Alert className="bg-primary/5 border-primary/20">
                    <react_icons_1.RocketIcon className="h-4 w-4"/>
                    <alert_1.AlertTitle>Developer Resources</alert_1.AlertTitle>
                    <alert_1.AlertDescription>
                        Access our comprehensive API documentation, SDKs, and developer guides to build custom
                        integrations with FLAM.
                    </alert_1.AlertDescription>
                    <div className="mt-4 flex gap-4">
                        <button_1.Button size="sm" variant="outline" asChild>
                            <link_1.default href="/docs/api">API Docs</link_1.default>
                        </button_1.Button>
                        <button_1.Button size="sm" variant="outline" asChild>
                            <link_1.default href="/docs/sdk">SDK Guide</link_1.default>
                        </button_1.Button>
                        <button_1.Button size="sm" variant="outline" asChild>
                            <link_1.default href="/docs/webhooks">Webhooks</link_1.default>
                        </button_1.Button>
                    </div>
                </alert_1.Alert>
            </MaxWidthWrapper>

            {/* CTA Section */}
            <MaxWidthWrapper className="py-16">
                <div className="flex flex-col items-center text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Ready to supercharge your matatu operations?
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-md">
                        Start integrating FLAM with your existing tools today and transform how you manage your fleet.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button_1.Button asChild>
                            <link_1.default href={user ? '/dashboard/integrations' : '/auth/sign-in'} className="flex items-center">
                                Get started with integrations
                                <lucide_react_1.ArrowRightIcon className="ml-2 h-4 w-4"/>
                            </link_1.default>
                        </button_1.Button>
                        <button_1.Button variant="outline" asChild>
                            <link_1.default href="/contact">Talk to our integration team</link_1.default>
                        </button_1.Button>
                    </div>
                </div>
            </MaxWidthWrapper>
        </div>);
};
exports.default = ChangeLogPage;
