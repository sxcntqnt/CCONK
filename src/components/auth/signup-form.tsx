'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { ROLE_ORDER, ROLE } from '@/utils/constants/roles';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LoaderIcon } from 'lucide-react';
import { TriStateSwitch } from '@/components/ui/switch';
import Link from 'next/link';

const SignUpForm = () => {
  const router = useRouter();
  const { signUp, isLoaded, setActive } = useSignUp();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roleIndex, setRoleIndex] = useState<number>(0); // Default: PASSENGER

  const role: Role = ROLE_ORDER[roleIndex];

  const sanitizeName = (input: string): string => {
    // Allow letters, spaces, hyphens; max 50 chars
    const sanitized = input.replace(/[^a-zA-Z\s-]/g, '').substring(0, 50);
    return sanitized.trim();
  };

  const sanitizeEmail = (input: string): string => {
    // Trim and lowercase; max 255 chars
    return input.trim().toLowerCase().substring(0, 255);
  };

  const sanitizePassword = (input: string): string => {
    // Trim; max 128 chars (arbitrary but reasonable limit)
    return input.trim().substring(0, 128);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      toast.error('Sign-up service not ready. Please try again.');
      return;
    }

    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizePassword(password);

    // Validation
    if (!sanitizedName) {
      toast.error("Name must contain valid characters (letters, spaces, hyphens).");
      return;
    }
    if (sanitizedName.length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (sanitizedPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(sanitizedPassword) || !/\d/.test(sanitizedPassword)) {
      toast.error("Password must contain both letters and numbers.");
      return;
    }

    setIsUpdating(true);

    try {
      await signUp.create({
        emailAddress: sanitizedEmail,
        password: sanitizedPassword,
        firstName: sanitizedName.split(" ")[0],
        lastName: sanitizedName.split(" ").slice(1).join(" ") || '',
        unsafeMetadata: { role },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      toast.success("Verification code sent to your email.");
      setIsVerifying(true);
    } catch (error: any) {
      console.log(JSON.stringify(error, null, 2));
      switch (error.errors[0]?.code) {
        case "form_identifier_exists":
          toast.error("This email is already registered. Please sign in.");
          break;
        case "form_password_pwned":
          toast.error("The password is too common. Please choose a stronger password.");
          break;
        case "form_param_format_invalid":
          toast.error("Invalid email address format.");
          break;
        case "form_password_length_too_short":
          toast.error("Password is too short (Clerk minimum).");
          break;
        default:
          toast.error("An error occurred. Please try again.");
          break;
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      toast.error('Verification service not ready. Please try again.');
      return;
    }

    const sanitizedCode = code.trim();
    if (!sanitizedCode || !/^\d{6}$/.test(sanitizedCode)) {
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: sanitizedCode,
      });

      if (completeSignUp.status === "complete") {
        await setActive({
          session: completeSignUp.createdSessionId,
        });
        router.push("/auth/auth-callback");
      } else {
        console.log(JSON.stringify(completeSignUp, null, 2));
        toast.error("Invalid verification code");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', JSON.stringify(error, null, 2));
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return isVerifying ? (
    <div className="flex flex-col items-start w-full text-start gap-y-6 py-8 px-0.5">
      <h2 className="text-2xl font-semibold">Verify your account</h2>
      <p className="text-sm text-muted-foreground">
        To continue, please enter the 6-digit verification code we just sent to {email}.
      </p>
      <form onSubmit={handleVerifyEmail} className="w-full">
        <div className="space-y-2 w-full pl-0.5">
          <Label htmlFor="code">Verification code</Label>
          <InputOTP
            id="code"
            name="code"
            maxLength={6}
            value={code}
            disabled={!isLoaded || isLoading}
            onChange={(e) => setCode(e)}
            className="pt-2"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div className="mt-4 w-full">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <LoaderIcon className="w-5 h-5 animate-spin" />
            ) : (
              "Verify code"
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              signUp?.prepareEmailAddressVerification({
                strategy: "email_code",
              });
              toast.success("Verification code resent to your email.");
            }}
            className="text-primary"
          >
            Resend code
          </Link>
        </p>
      </form>
    </div>
  ) : (
    <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
      <h2 className="text-2xl font-semibold">Create an account</h2>

      <form onSubmit={handleSignUp} className="w-full">
        <div className="space-y-2 w-full">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            disabled={!isLoaded || isUpdating}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full focus-visible:border-foreground"
          />
        </div>
        <div className="mt-4 space-y-2 w-full">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled={!isLoaded || isUpdating}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full focus-visible:border-foreground"
          />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative w-full">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={!isLoaded || isUpdating}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full focus-visible:border-foreground"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-700">
            {role === 'PASSENGER' ? 'Passenger' : role === 'DRIVER' ? 'Driver' : 'Owner'}
          </span>
          <TriStateSwitch
            onCheckedChange={(state) => setRoleIndex(state === false ? 0 : state === true ? 1 : 2)}
            disabled={!isLoaded || isUpdating}
          />
        </div>
        <div className="mt-4 w-full">
          <Button type="submit" disabled={!isLoaded || isUpdating} className="w-full">
            {isUpdating ? (
              <LoaderIcon className="w-5 h-5 animate-spin" />
            ) : (
              `Sign up as ${role.charAt(0) + role.slice(1).toLowerCase()}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
