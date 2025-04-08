// app/layout.tsx
import { Providers } from '@/components';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import { cn, generateMetadata, inter } from '@/utils';

export const metadata = generateMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className="scrollbar">
            <body
                className={cn('min-h-screen bg-background !font-default text-foreground antialiased', inter.variable)}
            >
                <Providers>
                    <div className="flex flex-col min-h-screen">
                        <main className="flex-1 overflow-auto p-6">{children}</main>
                    </div>
                    <Toaster richColors theme="dark" position="top-right" />
                </Providers>
            </body>
        </html>
    );
}
