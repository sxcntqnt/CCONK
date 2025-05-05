"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const nextjs_1 = require("@clerk/nextjs");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
const react_1 = __importStar(require("react"));
const sonner_1 = require("sonner");
const label_1 = require("@/components/ui/label");
const SignInForm = () => {
    const router = (0, navigation_1.useRouter)();
    const { signIn, isLoaded, setActive } = (0, nextjs_1.useSignIn)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const sanitizeEmail = (input) => {
        return input.trim().toLowerCase().substring(0, 255);
    };
    const sanitizePassword = (input) => {
        return input.trim().substring(0, 128);
    };
    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!isLoaded) {
            sonner_1.toast.error('Sign-in service not ready. Please try again.');
            return;
        }
        const sanitizedEmail = sanitizeEmail(email);
        const sanitizedPassword = sanitizePassword(password);
        if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) {
            sonner_1.toast.error(!sanitizedEmail ? 'Email is required!' : 'Please enter a valid email address.');
            return;
        }
        if (!sanitizedPassword) {
            sonner_1.toast.error('Password is required!');
            return;
        }
        setIsLoading(true);
        try {
            console.log('SignInForm - Calling signIn.create');
            const signInAttempt = await signIn.create({
                identifier: sanitizedEmail,
                password: sanitizedPassword,
                redirectUrl: '/auth/auth-callback', // Restore for reliability
            });
            if (signInAttempt.status === 'complete') {
                await setActive({
                    session: signInAttempt.createdSessionId,
                });
                console.log('SignInForm - Session set, navigating to auth-callback');
                window.location.href = '/auth/auth-callback'; // Full navigation
            }
            else {
                console.log(JSON.stringify(signInAttempt, null, 2));
                sonner_1.toast.error('Invalid email or password');
            }
        }
        catch (error) {
            if (error.errors && Array.isArray(error.errors)) {
                const firstError = error.errors[0];
                switch (firstError?.code) {
                    case 'session_exists':
                        console.log('SignInForm - Session exists, navigating to auth-callback');
                        window.location.href = '/auth/auth-callback';
                        break;
                    case 'form_identifier_not_found':
                        sonner_1.toast.error('This email is not registered. Please sign up first.');
                        break;
                    case 'form_password_incorrect':
                        sonner_1.toast.error('Incorrect password. Please try again.');
                        break;
                    case 'too_many_attempts':
                        sonner_1.toast.error('Too many attempts. Please wait before trying again.');
                        break;
                    default:
                        console.error('SignInForm - Unexpected error:', JSON.stringify(firstError, null, 2));
                        sonner_1.toast.error('An unexpected error occurred. Please try again.');
                        break;
                }
            }
            else {
                console.error('SignInForm - Sign-in error:', error);
                sonner_1.toast.error('A system error occurred. Please try again later.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!isLoaded) {
        return (<div className="flex w-full flex-col items-center gap-y-6 px-0.5 py-8">
                <lucide_react_1.LoaderIcon className="h-8 w-8 animate-spin"/>
                <p>Loading authentication services...</p>
            </div>);
    }
    return (<div className="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
            <h2 className="text-2xl font-semibold">Sign in to Sxcntqnt</h2>
            <form onSubmit={handleSignIn} className="w-full">
                <div className="w-full space-y-2">
                    <label_1.Label htmlFor="email">Email</label_1.Label>
                    <input_1.Input id="email" type="email" value={email} disabled={isLoading} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full focus-visible:border-foreground"/>
                </div>
                <div className="mt-4 space-y-2">
                    <label_1.Label htmlFor="password">Password</label_1.Label>
                    <div className="relative w-full">
                        <input_1.Input id="password" type={showPassword ? 'text' : 'password'} value={password} disabled={isLoading} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full focus-visible:border-foreground"/>
                        <button_1.Button type="button" size="icon" variant="ghost" disabled={isLoading} className="absolute right-1 top-1" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <lucide_react_1.EyeOff className="h-4 w-4"/> : <lucide_react_1.Eye className="h-4 w-4"/>}
                        </button_1.Button>
                    </div>
                </div>
                <div className="mt-4 w-full">
                    <button_1.Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <lucide_react_1.LoaderIcon className="h-5 w-5 animate-spin"/> : 'Sign in'}
                    </button_1.Button>
                </div>
            </form>
        </div>);
};
exports.default = SignInForm;
