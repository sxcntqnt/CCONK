import { Icons } from '@/components';
import SignInForm from '@/components/auth/signin-form';
import Link from 'next/link';

const SignInPage = () => {
    return (
        <div className="mx-auto flex h-screen max-w-sm flex-col items-start overflow-hidden pt-4 md:pt-20">
            <div className="flex w-full items-center border-b border-border/80 py-8">
                <Link href="/#home" className="flex items-center gap-x-2" legacyBehavior>
                    <Icons.logo className="h-6 w-6" />
                    <h1 className="text-lg font-medium">Sxcntqnt</h1>
                </Link>
            </div>
            <SignInForm />
            <div className="mt-6 flex w-full flex-col items-start">
                <p className="text-sm text-muted-foreground">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-primary">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary">
                        Privacy Policy
                    </Link>
                </p>
            </div>
            <div className="mt-auto flex w-full items-start border-t border-border/80 py-6">
                <p className="text-sm text-muted-foreground">
                    Don’t have an account?{' '}
                    <Link href="/auth/sign-up" className="text-primary">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignInPage;
