"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PhoneNumberForm;
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("zod");
const zod_2 = require("@hookform/resolvers/zod");
const input_1 = require("@/components/ui/input");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const react_1 = require("react");
const phone_constants_1 = require("@/utils/constants/phone-constants");
const phoneSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .min(1, 'Phone number is required')
        .refine((phone) => {
        const result = (0, phone_constants_1.validatePhonePrefix)(phone);
        return result.isValid;
    }, (phone) => {
        const result = (0, phone_constants_1.validatePhonePrefix)(phone);
        return { message: result.errorMessage || 'Invalid phone number' };
    }),
});
function PhoneNumberForm({ onValidSubmit, defaultPhone = '', isLoading = false, }) {
    const { register, handleSubmit, formState: { errors, isValid }, watch, setValue, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_2.zodResolver)(phoneSchema),
        mode: 'onChange',
        defaultValues: {
            phone: defaultPhone || '',
        },
    });
    const phone = watch('phone');
    (0, react_1.useEffect)(() => {
        // Auto-prefix if needed
        if (phone && !phone.startsWith(phone_constants_1.PHONE_VALIDATION_CONFIG.countryCode)) {
            let cleanedPhone = phone.replace(/^0/, '');
            if (cleanedPhone.length >= 9) {
                const potentialNumber = phone_constants_1.PHONE_VALIDATION_CONFIG.countryCode + cleanedPhone;
                const result = (0, phone_constants_1.validatePhonePrefix)(potentialNumber);
                if (result.isValid) {
                    setValue('phone', potentialNumber);
                }
            }
        }
    }, [phone, setValue]);
    const onSubmit = (data) => {
        onValidSubmit(data.phone);
    };
    return (<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <input_1.Input {...register('phone')} placeholder="254708920430" disabled={isLoading} className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 w-full"/>
                {errors.phone && (<p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <lucide_react_1.AlertCircle className="h-4 w-4"/>
                        {errors.phone.message}
                    </p>)}
            </div>

            <button_1.Button type="submit" disabled={!isValid || isLoading} className="w-full">
                Continue
            </button_1.Button>
        </form>);
}
