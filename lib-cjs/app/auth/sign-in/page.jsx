"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const signin_form_1 = __importDefault(require("@/components/auth/signin-form"));
const link_1 = __importDefault(require("next/link"));
const SignInPage = () => {
    return (<div className="mx-auto flex h-screen max-w-sm flex-col items-start overflow-hidden pt-4 md:pt-20">
            <div className="flex w-full items-center border-b border-border/80 py-8">
                <link_1.default href="/#home" className="flex items-center gap-x-2">
                    <components_1.Icons.logo className="h-6 w-6"/>
                    <h1 className="text-lg font-medium">Sxcntqnt</h1>
                </link_1.default>
            </div>
            <signin_form_1.default />
            <div className="mt-6 flex w-full flex-col items-start">
                <p className="text-sm text-muted-foreground">
                    By signing in, you agree to our{' '}
                    <link_1.default href="/terms" className="text-primary">
                        Terms of Service
                    </link_1.default>{' '}
                    and{' '}
                    <link_1.default href="/privacy" className="text-primary">
                        Privacy Policy
                    </link_1.default>
                </p>
            </div>
            <div className="mt-auto flex w-full items-start border-t border-border/80 py-6">
                <p className="text-sm text-muted-foreground">
                    Don’t have an account?{' '}
                    <link_1.default href="/auth/sign-up" className="text-primary">
                        Sign up
                    </link_1.default>
                </p>
            </div>
        </div>);
};
exports.default = SignInPage;
