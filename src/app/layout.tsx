// app/layout.tsx
import { Providers } from '@/components';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';
import { cn, generateMetadata, inter } from '@/utils';

export const metadata = generateMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className="scrollbar overflow-x-hidden overflow-y-hidden">
            <body
                className={cn(
                    'min-h-screen overflow-x-hidden overflow-y-hidden bg-background !font-default text-foreground antialiased',
                    inter.variable,
                )}
            >
                <Providers>
                    {/* Root container for layout */}
                    <div className="flex flex-col min-h-screen">
                        {/* Main content */}
                        <main className="flex-1 overflow-auto p-6">{children}</main>
                    </div>
                    <Toaster richColors theme="dark" position="top-right" />
                </Providers>
            </body>
        </html>
    );
}
