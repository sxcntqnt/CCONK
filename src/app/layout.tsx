import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components';
import '@/styles/globals.css';
import { aeonik, cn, generateMetadata, inter } from '@/utils';

export const metadata = generateMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html lang="en" className={cn('scrollbar-hide dark')}>
                <head>
                    <link rel="stylesheet" href="/_next/static/css/app/layout.css" as="style" />
                    <link rel="stylesheet" href="/_next/static/css/app/(marketing)/layout.css" as="style" />
                    <link rel="stylesheet" href="/_next/static/css/app/(marketing)/enterprise/page.css" as="style" />
                </head>
                <body
                    className={cn(
                        'min-h-screen bg-background text-foreground antialiased overflow-x-hidden',
                        aeonik.variable,
                        inter.variable,
                    )}
                >
                    <ErrorBoundary>
                        <Providers>
                            <Toaster richColors theme="dark" position="top-right" />
                            {children}
                        </Providers>
                    </ErrorBoundary>
                </body>
            </html>
        </ClerkProvider>
    );
}
