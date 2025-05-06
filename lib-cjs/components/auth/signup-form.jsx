"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const nextjs_1 = require("@clerk/nextjs");
const roles_1 = require("@/utils/constants/roles");
const sonner_1 = require("sonner");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
const input_otp_1 = require("@/components/ui/input-otp");
const ToggleGroup_module_css_1 = __importDefault(require("@/styles/ToggleGroup.module.css"));
const SignUpForm = () => {
    const router = (0, navigation_1.useRouter)();
    const { signUp, isLoaded, setActive } = (0, nextjs_1.useSignUp)();
    const [name, setName] = (0, react_1.useState)('');
    const [email, setEmail] = (0, react_1.useState)('');
    const [code, setCode] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [isVerifying, setIsVerifying] = (0, react_1.useState)(false);
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [roleIndex, setRoleIndex] = (0, react_1.useState)(0); // Default: PASSENGER
    const role = roles_1.ROLE_ORDER[roleIndex];
    (0, react_1.useEffect)(() => {
        console.log('Clerk state:', { isLoaded, signUp });
    }, [isLoaded, signUp]);
    const sanitizeName = (input) => {
        const sanitized = input.replace(/[^a-zA-Z\s-]/g, '').substring(0, 50);
        return sanitized.trim();
    };
    const sanitizeEmail = (input) => {
        return input.trim().toLowerCase().substring(0, 255);
    };
    const sanitizePassword = (input) => {
        return input.trim().substring(0, 128);
    };
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isLoaded) {
            sonner_1.toast.error('Sign-up service not ready. Please try again.');
            return;
        }
        const sanitizedName = sanitizeName(name);
        const sanitizedEmail = sanitizeEmail(email);
        const sanitizedPassword = sanitizePassword(password);
        if (!sanitizedName) {
            sonner_1.toast.error('Name must contain valid characters (letters, spaces, hyphens).');
            return;
        }
        if (sanitizedName.length < 2) {
            sonner_1.toast.error('Name must be at least 2 characters long.');
            return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(sanitizedEmail)) {
            sonner_1.toast.error('Please enter a valid email address.');
            return;
        }
        if (sanitizedPassword.length < 8) {
            sonner_1.toast.error('Password must be at least 8 characters long.');
            return;
        }
        if (!/[a-zA-Z]/.test(sanitizedPassword) || !/\d/.test(sanitizedPassword)) {
            sonner_1.toast.error('Password must contain both letters and numbers.');
            return;
        }
        setIsUpdating(true);
        try {
            await signUp.create({
                emailAddress: sanitizedEmail,
                password: sanitizedPassword,
                firstName: sanitizedName.split(' ')[0],
                lastName: sanitizedName.split(' ').slice(1).join(' ') || '',
                unsafeMetadata: { role },
            });
            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code',
            });
            sonner_1.toast.success('Verification code sent to your email.');
            setIsVerifying(true);
        }
        catch (error) {
            console.log(JSON.stringify(error, null, 2));
            switch (error.errors[0]?.code) {
                case 'form_identifier_exists':
                    sonner_1.toast.error('This email is already registered. Please sign in.');
                    break;
                case 'form_password_pwned':
                    sonner_1.toast.error('The password is too common. Please choose a stronger password.');
                    break;
                case 'form_param_format_invalid':
                    sonner_1.toast.error('Invalid email address format.');
                    break;
                case 'form_password_length_too_short':
                    sonner_1.toast.error('Password is too short (Clerk minimum).');
                    break;
                default:
                    sonner_1.toast.error('An error occurred. Please try again.');
                    break;
            }
        }
        finally {
            setIsUpdating(false);
        }
    };
    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        if (!isLoaded) {
            sonner_1.toast.error('Verification service not ready. Please try again.');
            return;
        }
        const sanitizedCode = code.trim();
        if (!sanitizedCode || !/^\d{6}$/.test(sanitizedCode)) {
            sonner_1.toast.error('Please enter a valid 6-digit verification code.');
            return;
        }
        setIsLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: sanitizedCode,
            });
            if (completeSignUp.status === 'complete') {
                await setActive({
                    session: completeSignUp.createdSessionId,
                });
                router.push('/auth/auth-callback');
            }
            else {
                console.log(JSON.stringify(completeSignUp, null, 2));
                sonner_1.toast.error('Invalid verification code');
            }
        }
        catch (error) {
            console.error('Error:', JSON.stringify(error, null, 2));
            sonner_1.toast.error('Something went wrong. Please try again later.');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Helper function to determine toggle item class
    const getToggleItemClass = (value) => {
        const baseClass = ToggleGroup_module_css_1.default.toggleGroupItem;
        if (roleIndex === value) {
            // Active state classes based on role
            switch (value) {
                case 0:
                    return `${baseClass} ${ToggleGroup_module_css_1.default.toggleItemPassenger}`;
                case 1:
                    return `${baseClass} ${ToggleGroup_module_css_1.default.toggleItemDriver}`;
                case 2:
                    return `${baseClass} ${ToggleGroup_module_css_1.default.toggleItemOwner}`;
                default:
                    return baseClass;
            }
        }
        else {
            // Inactive state
            return `${baseClass} ${ToggleGroup_module_css_1.default.toggleItemInactive}`;
        }
    };
    return isVerifying ? (<div className="flex flex-col items-start w-full text-start gap-y-6 py-8 px-0.5 min-h-screen overflow-y-auto">
            <h2 className="text-2xl font-semibold">Verify your account</h2>
            <p className="text-sm text-muted-foreground">
                To continue, please enter the 6-digit verification code we just sent to {email}.
            </p>
            <form onSubmit={handleVerifyEmail} className="w-full">
                <div className="space-y-2 w-full pl-0.5">
                    <label_1.Label htmlFor="code">Verification code</label_1.Label>
                    <input_otp_1.InputOTP id="code" name="code" maxLength={6} value={code} disabled={!isLoaded || isLoading} onChange={(e) => setCode(e)} className="pt-2">
                        <input_otp_1.InputOTPGroup>
                            <input_otp_1.InputOTPSlot index={0}/>
                            <input_otp_1.InputOTPSlot index={1}/>
                            <input_otp_1.InputOTPSlot index={2}/>
                            <input_otp_1.InputOTPSlot index={3}/>
                            <input_otp_1.InputOTPSlot index={4}/>
                            <input_otp_1.InputOTPSlot index={5}/>
                        </input_otp_1.InputOTPGroup>
                    </input_otp_1.InputOTP>
                </div>
                <div className="mt-4 w-full">
                    <button_1.Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <lucide_react_1.LoaderIcon className="w-5 h-5 animate-spin"/> : 'Verify code'}
                    </button_1.Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                    Didn't receive the code?{' '}
                    <link_1.default href="#" onClick={(e) => {
            e.preventDefault();
            signUp?.prepareEmailAddressVerification({
                strategy: 'email_code',
            });
            sonner_1.toast.success('Verification code resent to your email.');
        }} className="text-primary">
                        Resend code
                    </link_1.default>
                </p>
            </form>
        </div>) : (<div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5 min-h-screen overflow-y-auto">
            <h2 className="text-2xl font-semibold">Create an account</h2>
            <form onSubmit={handleSignUp} className="w-full">
                <div className="space-y-2 w-full">
                    <label_1.Label htmlFor="name">Name</label_1.Label>
                    <input_1.Input id="name" type="text" value={name} disabled={!isLoaded || isUpdating} onChange={(e) => {
            console.log('Name updated:', e.target.value);
            setName(e.target.value);
        }} placeholder="Enter your name" className="w-full focus-visible:border-foreground"/>
                </div>
                <div className="mt-4 space-y-2 w-full">
                    <label_1.Label htmlFor="email">Email</label_1.Label>
                    <input_1.Input id="email" type="email" value={email} disabled={!isLoaded || isUpdating} onChange={(e) => {
            console.log('Email updated:', e.target.value);
            setEmail(e.target.value);
        }} placeholder="Enter your email" className="w-full focus-visible:border-foreground"/>
                </div>
                <div className="mt-4 space-y-2">
                    <label_1.Label htmlFor="password">Password</label_1.Label>
                    <div className="relative w-full">
                        <input_1.Input id="password" type={showPassword ? 'text' : 'password'} value={password} disabled={!isLoaded || isUpdating} onChange={(e) => {
            console.log('Password updated:', e.target.value);
            setPassword(e.target.value);
        }} placeholder="Enter your password" className="w-full focus-visible:border-foreground"/>
                        <button_1.Button type="button" size="icon" variant="ghost" className="absolute top-1 right-1" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <lucide_react_1.EyeOff className="w-4 h-4"/> : <lucide_react_1.Eye className="w-4 h-4"/>}
                        </button_1.Button>
                    </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <label_1.Label>Role</label_1.Label>
                    <div className={ToggleGroup_module_css_1.default.toggleGroupRoot} data-disabled={!isLoaded || isUpdating}>
                        <button type="button" className={getToggleItemClass(0)} onClick={() => !isUpdating && setRoleIndex(0)} disabled={!isLoaded || isUpdating} data-disabled={!isLoaded || isUpdating}>
                            Passenger
                        </button>
                        <button type="button" className={getToggleItemClass(1)} onClick={() => !isUpdating && setRoleIndex(1)} disabled={!isLoaded || isUpdating} data-disabled={!isLoaded || isUpdating}>
                            Driver
                        </button>
                        <button type="button" className={getToggleItemClass(2)} onClick={() => !isUpdating && setRoleIndex(2)} disabled={!isLoaded || isUpdating} data-disabled={!isLoaded || isUpdating}>
                            Owner
                        </button>
                    </div>
                </div>
                {/* Added CAPTCHA element */}
                <div className="mt-4">
                    <div id="clerk-captcha"></div>
                </div>
                <div className="mt-4 w-full">
                    <button_1.Button type="submit" disabled={!isLoaded || isUpdating} className="w-full">
                        {isUpdating ? (<lucide_react_1.LoaderIcon className="w-5 h-5 animate-spin"/>) : (`Sign up as ${role.charAt(0) + role.slice(1).toLowerCase()}`)}
                    </button_1.Button>
                </div>
            </form>
        </div>);
};
exports.default = SignUpForm;
