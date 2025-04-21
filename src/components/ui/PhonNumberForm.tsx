'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import {
    PHONE_PREFIX_REGEX,
    PHONE_VALIDATION_CONFIG,
    VALID_PHONE_PREFIXES,
    validatePhonePrefix,
} from '@/utils/constants/phone-constants';

const phoneSchema = z.object({
    phone: z
        .string()
        .min(1, 'Phone number is required')
        .refine(
            (phone) => {
                const result = validatePhonePrefix(phone);
                return result.isValid;
            },
            (phone) => {
                const result = validatePhonePrefix(phone);
                return { message: result.errorMessage || 'Invalid phone number' };
            },
        ),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function PhoneNumberForm({
    onValidSubmit,
    defaultPhone = '',
    isLoading = false,
}: {
    onValidSubmit: (phone: string) => void;
    defaultPhone?: string;
    isLoading?: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        setValue,
    } = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
        mode: 'onChange',
        defaultValues: {
            phone: defaultPhone || '',
        },
    });

    const phone = watch('phone');

    useEffect(() => {
        // Auto-prefix if needed
        if (phone && !phone.startsWith(PHONE_VALIDATION_CONFIG.countryCode)) {
            let cleanedPhone = phone.replace(/^0/, '');
            if (cleanedPhone.length >= 9) {
                const potentialNumber = PHONE_VALIDATION_CONFIG.countryCode + cleanedPhone;
                const result = validatePhonePrefix(potentialNumber);
                if (result.isValid) {
                    setValue('phone', potentialNumber);
                }
            }
        }
    }, [phone, setValue]);

    const onSubmit = (data: PhoneFormData) => {
        onValidSubmit(data.phone);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Input
                    {...register('phone')}
                    placeholder="254708920430"
                    disabled={isLoading}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 w-full"
                />
                {errors.phone && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone.message}
                    </p>
                )}
            </div>

            <Button type="submit" disabled={!isValid || isLoading} className="w-full">
                Continue
            </Button>
        </form>
    );
}
