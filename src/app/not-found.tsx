import { Footer, Navbar } from '@/components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const NotFound = () => {
    return (
        <main className="relative flex flex-col items-center justify-center px-4">
            <Navbar />
            <div className="mx-auto flex h-screen flex-col items-center justify-center">
                <div className="flex h-full flex-col items-center justify-center">
                    <span className="not-found rounded-md bg-gradient-to-br from-violet-400 to-purple-600 px-3.5 py-1 text-sm font-medium text-neutral-50">
                        404
                    </span>
                    <h1 className="mt-5 text-3xl font-bold text-neutral-50 md:text-5xl">Not Found</h1>
                    <p className="mx-auto mt-5 max-w-xl text-center text-base font-medium text-neutral-400">
                        The page you are looking for does not exist. <br /> But don&apos;t worry, we&apos;ve got you
                        covered. You can{' '}
                        <Link href="/resources/help" className="text-foreground">
                            contact us
                        </Link>
                        .
                    </p>
                    <Link href="/" legacyBehavior>
                        <Button className="mt-8">Back to homepage</Button>
                    </Link>
                </div>
            </div>
            <Footer />
        </main>
    );
};

export default NotFound;
