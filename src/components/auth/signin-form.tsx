'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignIn } from '@clerk/nextjs';
import { Eye, EyeOff, LoaderIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';


const SignInForm = () => {
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sanitizeEmail = (input: string): string => {
    // Trim, lowercase, max 255 chars
    return input.trim().toLowerCase().substring(0, 255);
  };

  const sanitizePassword = (input: string): string => {
    // Trim, max 128 chars
    return input.trim().substring(0, 128);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      toast.error('Sign-in service not ready. Please try again.');
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizePassword(password);

    // Validation
    if (!sanitizedEmail) {
      toast.error('Email is required!');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!sanitizedPassword) {
      toast.error('Password is required!');
      return;
    }

    setIsLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: sanitizedEmail,
        password: sanitizedPassword,
        redirectUrl: '/auth/auth-callback',
      });

      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
        });
        router.push('/auth/auth-callback');
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        toast.error('Invalid email or password');
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const firstError = error.errors[0];
        switch (firstError?.code) {
          case 'form_identifier_not_found':
            toast.error('This email is not registered. Please sign up first.');
            break;
          case 'form_password_incorrect':
            toast.error('Incorrect password. Please try again.');
            break;
          case 'too_many_attempts':
            toast.error('Too many attempts. Please wait before trying again.');
            break;
          case 'form_param_format_invalid':
            toast.error('Invalid email format detected.');
            break;
          case 'form_param_nil':
            toast.error('Email and password are required.');
            break;
          default:
            console.error('Unexpected error:', JSON.stringify(firstError, null, 2));
            toast.error('An unexpected error occurred. Please try again or contact support.');
            break;
        }
      } else {
        console.error('Sign-in error:', error);
        toast.error('A system error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-y-6 px-0.5 py-8">
      <h2 className="text-2xl font-semibold">Sign in to Sxcntqnt</h2>

      <form onSubmit={handleSignIn} className="w-full">
        <div className="w-full space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled={!isLoaded || isLoading}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              disabled={!isLoaded || isLoading}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full focus-visible:border-foreground"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={!isLoaded || isLoading}
              className="absolute right-1 top-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 w-full">
          <Button
            type="submit"
            disabled={!isLoaded || isLoading}
            className="w-full"
          >
            {isLoading ? <LoaderIcon className="h-5 w-5 animate-spin" /> : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm;
