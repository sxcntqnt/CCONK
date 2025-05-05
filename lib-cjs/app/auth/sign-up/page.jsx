"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components"); // Assuming Icons is still here
const signup_form_1 = __importDefault(require("@/components/auth/signup-form")); // Updated import path
const link_1 = __importDefault(require("next/link"));
const SignUpPage = () => {
    return (<div className="mx-auto flex h-dvh max-w-sm flex-col items-start overflow-hidden pt-4 md:pt-20">
            {/* Header with Logo */}
            <div className="flex w-full items-center border-b border-border/80 py-8">
                <link_1.default href="/#home" className="flex items-center gap-x-2" legacyBehavior>
                    <components_1.Icons.logo className="h-6 w-6"/>
                    <h1 className="text-lg font-medium">Sxcntqnt</h1>
                </link_1.default>
            </div>
            {/* SignUpForm with Role Toggle */}
            <signup_form_1.default />
            {/* Terms and Privacy Links */}
            <div className="flex w-full flex-col items-start">
                <p className="text-sm text-muted-foreground">
                    By signing up, you agree to our{' '}
                    <link_1.default href="/terms" className="text-primary" legacyBehavior>
                        Terms of Service{' '}
                    </link_1.default>
                    and{' '}
                    <link_1.default href="/privacy" className="text-primary">
                        Privacy Policy
                    </link_1.default>
                </p>
            </div>
            {/* Sign-In Link */}
            <div className="mt-auto flex w-full items-start border-t border-border/80 py-6">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <link_1.default href="/auth/sign-in" className="text-primary">
                        Sign in
                    </link_1.default>
                </p>
            </div>
        </div>);
};
exports.default = SignUpPage;
