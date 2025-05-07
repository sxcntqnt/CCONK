import { BarChart3Icon, LineChartIcon, FolderOpenIcon, WandSparklesIcon } from 'lucide-react';
import { SewingPinIcon, BellIcon, BarChartIcon } from '@radix-ui/react-icons';
import Image from 'next/image';

export const DEFAULT_AVATAR_URL =
    'https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear&backgroundRotation=0,360&seed=';

export const PAGINATION_LIMIT = 10;

export const MATATU_PARTNERS = [
    {
        name: 'SUPERMETRO',
        logo: '/assets/ptrns/super-metro.svg',
    },
    {
        name: 'NICCO',
        logo: '/assets/ptrns/nicco-sacco.svg',
    },
    {
        name: 'RONGAO',
        logo: '/assets/ptrns/rongao-sacco.svg',
    },
    {
        name: 'BURUSACCO',
        logo: '/assets/ptrns/buru-sacco.svg',
    },
    {
        name: 'UMOINNER',
        logo: '/assets/ptrns/umoinner.svg',
    },
    {
        name: 'FORWARD',
        logo: '/assets/ptrns/forward-sacco.svg',
    },
] as const;

export const FLAM_FEATURES = [
    {
        Icon: SewingPinIcon,
        name: 'Real-Time Tracking',
        description: 'Monitor matatu locations live on an interactive map.',
        href: '/dashboard',
        cta: 'Try Now',
        className: 'col-span-1 md:col-span-2',
        background: '/assets/features/tracking.png', // String path, no JSX
    },
    {
        Icon: LineChartIcon,
        name: 'Route Optimization',
        description: 'Find the fastest routes to save time and fuel.',
        href: '/routes',
        cta: 'Explore Routes',
        className: 'col-span-1',
        background: '/assets/features/routes.png',
    },
    {
        Icon: BellIcon,
        name: 'Smart Notifications',
        description: 'Get alerts for arrivals, delays, and more.',
        href: '/notifications',
        cta: 'Set Alerts',
        className: 'col-span-1',
        background: '/assets/features/notifications.png',
    },
    {
        Icon: BarChart3Icon,
        name: 'Fleet Analytics',
        description: 'Analyze performance and improve operations.',
        href: '/analytics',
        cta: 'View Insights',
        className: 'col-span-1 md:col-span-2',
        background: '/assets/features/analytics.png',
    },
] as const;

export const TESTIMONIALS = [
    {
        name: 'John Mwangi',
        userType: 'Commuter',
        testimony: 'FLAM has made my daily commute so much easier. I always know when the matatu is arriving!',
        rating: 5,
    },
    {
        name: 'Grace Wanjiku',
        userType: 'Matatu Operator',
        testimony: 'The analytics dashboard helps me optimize routes and increase profits.',
        rating: 4,
    },
    {
        name: 'Peter Kamau',
        userType: 'Commuter',
        testimony: 'Real-time tracking is a game-changer. No more waiting blindly at the bus stop.',
        rating: 5,
    },
    {
        name: 'Mary Achieng',
        userType: 'Commuter',
        testimony: 'Notifications keep me updated on delays, so I can plan better.',
        rating: 4,
    },
    {
        name: 'David Otieno',
        userType: 'Matatu Operator',
        testimony: 'FLAM’s fleet management tools have streamlined our operations.',
        rating: 5,
    },
    {
        name: 'Sarah Njeri',
        userType: 'Commuter',
        testimony: 'I love how easy it is to find the fastest route with FLAM.',
        rating: 4,
    },
    {
        name: 'James Njoroge',
        userType: 'Commuter',
        testimony: 'The app is user-friendly and saves me time every day.',
        rating: 5,
    },
    {
        name: 'Esther Muthoni',
        userType: 'Matatu Operator',
        testimony: 'FLAM helps us keep passengers happy with timely updates.',
        rating: 4,
    },
    {
        name: 'Michael Omondi',
        userType: 'Commuter',
        testimony: 'Best app for matatu tracking in Nairobi!',
        rating: 5,
    },
] as const;

export const FLAM_USE_CASES = [
    {
        icon: SewingPinIcon,
        title: 'Track Your Matatu',
        description: 'Enter your route and see real-time locations of all matatus on your selected path.',
        link: '/dashboard',
    },
    {
        icon: LineChartIcon,
        title: 'Optimize Your Journey',
        description: 'Get recommendations for fastest routes and estimated arrival times.',
        link: '/routes',
    },
    {
        icon: BellIcon,
        title: 'Stay Informed',
        description: 'Receive notifications about arrivals, delays, and changes to your usual routes.',
        link: '/notifications',
    },
] as const;

export const COMPANIES = [
    {
        name: 'Asana',
        logo: '/assets/company-01.svg',
    },
    {
        name: 'Tidal',
        logo: '/assets/company-02.svg',
    },
    {
        name: 'Innovaccer',
        logo: '/assets/company-03.svg',
    },
    {
        name: 'Linear',
        logo: '/assets/company-04.svg',
    },
    {
        name: 'Raycast',
        logo: '/assets/company-05.svg',
    },
    {
        name: 'Labelbox',
        logo: '/assets/company-06.svg',
    },
] as const;

export const PROCESS = [
    {
        title: 'Organize Your Links',
        description: 'Efficiently categorize and tag your links for quick access and easy management.',
        icon: FolderOpenIcon,
    },
    {
        title: 'Shorten and Customize',
        description: 'Create concise, branded links that are easy to share and track.',
        icon: WandSparklesIcon,
    },
    {
        title: 'Analyze and Optimize',
        description: 'Gain insights into link performance and optimize for better engagement.',
        icon: BarChart3Icon,
    },
] as const;

export const FEATURES = [
    {
        title: 'Link shortening',
        description: 'Create short links that are easy to remember and share.',
    },
    {
        title: 'Advanced analytics',
        description: 'Track and measure the performance of your links.',
    },
    {
        title: 'Password protection',
        description: 'Secure your links with a password.',
    },
    {
        title: 'Custom QR codes',
        description: 'Generate custom QR codes for your links.',
    },
    {
        title: 'Link expiration',
        description: 'Set an expiration date for your links.',
    },
    {
        title: 'Team collaboration',
        description: 'Share links with your team and collaborate in real-time.',
    },
] as const;

export const REVIEWS = [
    {
        name: 'Michael Smith',
        username: '@michaelsmith',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        rating: 5,
        review: 'This tool is a lifesaver! Managing and tracking my links has never been easier. A must-have for anyone dealing with numerous links.',
    },
    {
        name: 'Emily Johnson',
        username: '@emilyjohnson',
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        rating: 4,
        review: 'Very useful app! It has streamlined my workflow considerably. A few minor bugs, but overall a great experience.',
    },
    {
        name: 'Daniel Williams',
        username: '@danielwilliams',
        avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        rating: 5,
        review: "I've been using this app daily for months. The insights and analytics it provides are invaluable. Highly recommend it!",
    },
    {
        name: 'Sophia Brown',
        username: '@sophiabrown',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        rating: 4,
        review: 'This app is fantastic! It offers everything I need to manage my links efficiently.',
    },
    {
        name: 'James Taylor',
        username: '@jamestaylor',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        rating: 5,
        review: "Absolutely love this app! It's intuitive and feature-rich. Has significantly improved how I manage and track links.",
    },
    {
        name: 'Olivia Martinez',
        username: '@oliviamartinez',
        avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        rating: 4,
        review: 'Great app with a lot of potential. It has already saved me a lot of time. Looking forward to future updates and improvements.',
    },
    {
        name: 'William Garcia',
        username: '@williamgarcia',
        avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
        rating: 5,
        review: "This app is a game-changer for link management. It's easy to use, extremely powerful and highly recommended!",
    },
    {
        name: 'Mia Rodriguez',
        username: '@miarodriguez',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        rating: 4,
        review: "I've tried several link management tools, but this one stands out. It's simple, effective.",
    },
    {
        name: 'Henry Lee',
        username: '@henrylee',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        rating: 5,
        review: "This app has transformed my workflow. Managing and analyzing links is now a breeze. I can't imagine working without it.",
    },
] as const;
