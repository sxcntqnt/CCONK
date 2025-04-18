import { buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/utils';
import { ArrowRightIcon, MapIcon, MapPinIcon, BellIcon, BarChartIcon, SmartphoneIcon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Add Image import
import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';

export const CARDS = [
    {
        Icon: MapIcon,
        name: 'Real-Time Tracking',
        description: 'Track matatus in real-time with accurate GPS positioning and arrival estimates.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (
            <Card className="absolute left-10 top-10 origin-top rounded-none rounded-tl-md border border-r-0 border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105">
                <CardHeader>
                    <CardTitle>Track Your Matatu</CardTitle>
                    <CardDescription>Get real-time updates on your matatu's location.</CardDescription>
                </CardHeader>
                <CardContent className="-mt-4">
                    <Label>Find your route</Label>
                    <Input
                        type="text"
                        placeholder="Enter route number or destination..."
                        className="w-full focus-visible:ring-0 focus-visible:ring-transparent"
                    />
                </CardContent>
            </Card>
        ),
    },
    {
        Icon: MapPinIcon,
        name: 'Route Optimization',
        description: 'Get the best routes based on traffic conditions and your preferences.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (
            <Command className="origin-to absolute right-10 top-10 w-[70%] translate-x-0 border border-border p-2 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10">
                <Input placeholder="Where to?" />
                <div className="mt-1 cursor-pointer">
                    <div className="rounded-md px-4 py-2 hover:bg-muted">Route 42 - CBD to Westlands</div>
                    <div className="rounded-md px-4 py-2 hover:bg-muted">Route 23 - Eastlands Express</div>
                    <div className="rounded-md px-4 py-2 hover:bg-muted">Route 87 - Southern Bypass</div>
                    <div className="rounded-md px-4 py-2 hover:bg-muted">Route 15 - Northern Circuit</div>
                    <div className="rounded-md px-4 py-2 hover:bg-muted">Route 32 - City Center Loop</div>
                </div>
            </Command>
        ),
    },
    {
        Icon: SmartphoneIcon,
        name: 'User Interface',
        description: 'Intuitive mobile apps for Android and iOS with offline functionality.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-1',
        background: (
            <div className="absolute right-10 top-10 flex h-[300px] w-[70%] items-center justify-center rounded-md border border-border bg-black/20 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105">
                <div className="flex space-x-4">
                    <div className="h-64 w-32 rounded-xl border-2 border-border bg-black/30 shadow-lg"></div>
                    <div className="h-64 w-32 rounded-xl border-2 border-border bg-black/30 shadow-lg"></div>
                </div>
            </div>
        ),
    },
    {
        Icon: BellIcon,
        name: 'Smart Notifications',
        description: 'Personalized alerts and predictive notifications based on your routines.',
        className: 'col-span-3 lg:col-span-1',
        href: '#',
        cta: 'Learn more',
        background: (
            <Card className="absolute right-10 top-10 origin-top w-[70%] rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105">
                <CardHeader>
                    <CardTitle>Your Notifications</CardTitle>
                    <CardDescription>Stay informed about your journeys</CardDescription>
                </CardHeader>
                <CardContent className="-mt-4 space-y-2">
                    <div className="rounded-md bg-muted/30 p-2 text-sm">Route 42 will arrive in 5 minutes</div>
                    <div className="rounded-md bg-muted/30 p-2 text-sm">
                        Heavy traffic on your usual route - try Route 23
                    </div>
                    <div className="rounded-md bg-muted/30 p-2 text-sm">
                        Morning commute: Matatu expected at 8:15 AM
                    </div>
                </CardContent>
            </Card>
        ),
    },
    {
        Icon: BarChartIcon,
        name: 'Data Analytics',
        description: 'Advanced dashboards with trend analysis and demand forecasting for operators.',
        href: '#',
        cta: 'Learn more',
        className: 'col-span-3 lg:col-span-2',
        background: (
            <div className="absolute right-2 top-4 h-[300px] w-[600px] border-none pl-28 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105 md:pl-0">
                <div className="flex h-full items-end space-x-4 px-10">
                    <div className="h-1/3 w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-2/3 w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-1/2 w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-3/4 w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-2/5 w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-full w-16 rounded-t-md bg-blue-500/70"></div>
                    <div className="h-3/5 w-16 rounded-t-md bg-blue-500/70"></div>
                </div>
            </div>
        ),
    },
];

const BentoGrid = ({ children, className }: { children: ReactNode; className?: string }) => {
    return <div className={cn('grid w-full auto-rows-[22rem] grid-cols-3 gap-4', className)}>{children}</div>;
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    href,
    cta,
}: {
    name: string;
    className: string;
    background: ReactNode | string; // Allow string for image paths
    Icon: LucideIcon;
    description: string;
    href: string;
    cta: string;
}) => (
    <div
        key={name}
        className={cn(
            'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border border-border/60',
            'bg-black [box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]',
            className,
        )}
    >
        <div>
            {typeof background === 'string' ? (
                <Image
                    src={background}
                    alt={name}
                    width={600}
                    height={300}
                    quality={100}
                    className="absolute left-10 top-10 origin-top rounded-md border border-border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_100%)] group-hover:scale-105"
                />
            ) : (
                background
            )}
        </div>
        <div className="pointer-events-none z-10 flex flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
            <Icon className="h-12 w-12 origin-left text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
            <h3 className="text-xl font-semibold text-neutral-300">{name}</h3>
            <p className="max-w-lg text-neutral-400">{description}</p>
        </div>
        <div
            className={cn(
                'absolute bottom-0 flex w-full translate-y-10 flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100',
            )}
        >
            <Link
                href={href}
                className={cn(
                    buttonVariants({
                        size: 'sm',
                        variant: 'ghost',
                    }),
                    'cursor-pointer flex items-center',
                )}
            >
                {cta}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
        </div>
        <div className="pointer-events-none absolute inset-0 transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
    </div>
);

export { BentoCard, BentoGrid };
