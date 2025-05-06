"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAV_LINKS = void 0;
const lucide_react_1 = require("lucide-react");
exports.NAV_LINKS = [
    {
        title: 'Features',
        href: '/features',
        menu: [
            {
                title: 'Link Shortening',
                tagline: 'Shorten links and track their performance.',
                href: '/features/link-shortening',
                icon: lucide_react_1.Link2Icon,
            },
            {
                title: 'Password Protection',
                tagline: 'Secure your links with a password.',
                href: '/features/password-protection',
                icon: lucide_react_1.LockIcon,
            },
            {
                title: 'Advanced Analytics',
                tagline: 'Gain insights into who is clicking your links.',
                href: '/features/analytics',
                icon: lucide_react_1.LineChartIcon,
            },
            {
                title: 'Custom QR Codes',
                tagline: 'Use QR codes to reach your audience.',
                href: '/features/qr-codes',
                icon: lucide_react_1.QrCodeIcon,
            },
        ],
    },
    {
        title: 'Pricing',
        href: '/pricing',
    },
    {
        title: 'Enterprise',
        href: '/enterprise',
    },
    {
        title: 'Resources',
        href: '/resources',
        menu: [
            {
                title: 'Blog',
                tagline: 'Read articles on the latest trends in tech.',
                href: '/resources/blog',
                icon: lucide_react_1.NewspaperIcon,
            },
            {
                title: 'Help',
                tagline: 'Get answers to your questions.',
                href: '/resources/help',
                icon: lucide_react_1.HelpCircleIcon,
            },
        ],
    },
    {
        title: 'Changelog',
        href: '/changelog',
    },
];
