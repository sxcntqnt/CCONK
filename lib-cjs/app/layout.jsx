"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const nextjs_1 = require("@clerk/nextjs");
const components_1 = require("@/components");
const sonner_1 = require("@/components/ui/sonner");
const components_2 = require("@/components");
require("@/styles/globals.css");
const utils_1 = require("@/utils");
exports.metadata = (0, utils_1.generateMetadata)();
function RootLayout({ children }) {
    return (<nextjs_1.ClerkProvider>
            <html lang="en" className={(0, utils_1.cn)('scrollbar-hide dark')}>
                <head>
                    <link rel="stylesheet" href="/_next/static/css/app/layout.css" as="style"/>
                    <link rel="stylesheet" href="/_next/static/css/app/(marketing)/layout.css" as="style"/>
                    <link rel="stylesheet" href="/_next/static/css/app/(marketing)/enterprise/page.css" as="style"/>
                </head>
                <body className={(0, utils_1.cn)('min-h-screen bg-background text-foreground antialiased overflow-x-hidden', utils_1.aeonik.variable, utils_1.inter.variable)}>
                    <components_2.ErrorBoundary>
                        <components_1.Providers>
                            <sonner_1.Toaster richColors theme="dark" position="top-right"/>
                            {children}
                        </components_1.Providers>
                    </components_2.ErrorBoundary>
                </body>
            </html>
        </nextjs_1.ClerkProvider>);
}
