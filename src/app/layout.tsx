// src/app/layout.tsx
import { Providers } from '@/components';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import { aeonik, cn, generateMetadata, inter } from '@/utils';

export const metadata = generateMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={cn('scrollbar-hide')}>
            <body
                className={cn(
                    'min-h-screen bg-background text-foreground antialiased overflow-x-hidden',
                    aeonik.variable,
                    inter.variable,
                )}
            >
                <Providers>
                    <Toaster richColors theme="dark" position="top-right" />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
