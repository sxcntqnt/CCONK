import { Icons } from '@/components'; // Assuming Icons is still here
import SignUpForm from '@/components/auth/signup-form'; // Updated import path
import Link from 'next/link';

const SignUpPage = () => {
    return (
        <div className="mx-auto flex h-dvh max-w-sm flex-col items-start overflow-hidden pt-4 md:pt-20">
            {/* Header with Logo */}
            <div className="flex w-full items-center border-b border-border/80 py-8">
                <Link href="/#home" className="flex items-center gap-x-2">
                    <Icons.logo className="h-6 w-6" />
                    <h1 className="text-lg font-medium">Sxcntqnt</h1>
                </Link>
            </div>

            {/* SignUpForm with Role Toggle */}
            <SignUpForm />

            {/* Terms and Privacy Links */}
            <div className="flex w-full flex-col items-start">
                <p className="text-sm text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-primary">
                        Terms of Service{' '}
                    </Link>
                    and{' '}
                    <Link href="/privacy" className="text-primary">
                        Privacy Policy
                    </Link>
                </p>
            </div>

            {/* Sign-In Link */}
            <div className="mt-auto flex w-full items-start border-t border-border/80 py-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/auth/sign-in" className="text-primary">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
