'use client';

import Image from 'next/image';
import { useUser, useSignIn, useAuth } from '@clerk/nextjs';
import { useUserStore, useBusStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MatatuCapacity, matatuConfigs } from '@/utils/constants/matatuSeats';

const InputField: React.FC<{
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    containerStyle?: string;
    inputStyle?: string;
    type?: string;
}> = ({ label, placeholder, value, onChange, containerStyle, inputStyle, type = 'text' }) => (
    <div className={`mb-4 ${containerStyle}`}>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <Input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full border border-gray-300 rounded-lg p-3.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputStyle}`}
        />
    </div>
);

const RideLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {children}
    </div>
);

const ProfilePage = () => {
    const { user: clerkUser } = useUser();
    const { isSignedIn } = useAuth();
    const { isLoaded, signIn, setActive } = useSignIn();
    const { currentUser, setCurrentUser } = useUserStore();
    const { addBus } = useBusStore();
    const router = useRouter();

    const [profileFormData, setProfileFormData] = useState({
        name: currentUser?.name || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || '',
        email: currentUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '',
        phoneNumber: currentUser?.phoneNumber || clerkUser?.primaryPhoneNumber?.phoneNumber || '',
    });

    const [vehicleFormData, setVehicleFormData] = useState({
        licensePlate: '',
        capacity: '',
        category: '' as MatatuCapacity | '',
    });

    const [forgotPasswordFormData, setForgotPasswordFormData] = useState({
        email: clerkUser?.primaryEmailAddress?.emailAddress || '',
        password: '',
        code: '',
    });

    const [vehicleImages, setVehicleImages] = useState<File[]>([]);
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [secondFactor, setSecondFactor] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isSignedIn && !successfulCreation) {
            setForgotPasswordFormData((prev) => ({
                ...prev,
                email: clerkUser?.primaryEmailAddress?.emailAddress || '',
            }));
        }
    }, [isSignedIn, clerkUser, successfulCreation]);

    if (!isLoaded) {
        return null;
    }

    const handleProfileInputChange = (field: keyof typeof profileFormData) => (value: string) => {
        setProfileFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVehicleInputChange = (field: keyof typeof vehicleFormData) => (value: string) => {
        setVehicleFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleForgotPasswordInputChange = (field: keyof typeof forgotPasswordFormData) => (value: string) => {
        setForgotPasswordFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setVehicleImages((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleSaveProfile = () => {
        if (!currentUser && !clerkUser) {
            alert('No user data available to update.');
            return;
        }

        const updatedUser = {
            id: currentUser?.id || (clerkUser?.id ? parseInt(clerkUser.id) : 0),
            clerkId: currentUser?.clerkId || clerkUser?.id || '',
            name: profileFormData.name,
            email: profileFormData.email,
            phoneNumber: profileFormData.phoneNumber || undefined,
            image: currentUser?.image || clerkUser?.imageUrl || '/images/placeholder.png',
            role:
                currentUser?.role ||
                (typeof clerkUser?.publicMetadata.role === 'string' ? clerkUser.publicMetadata.role : 'passenger'),
        };

        setCurrentUser(updatedUser);
        alert('Profile updated successfully!');
    };

    const handleSaveVehicle = () => {
        if (!vehicleFormData.licensePlate || !vehicleFormData.capacity || !vehicleFormData.category) {
            alert('Please fill all vehicle fields.');
            return;
        }

        addBus({
            licensePlate: vehicleFormData.licensePlate,
            capacity: parseInt(vehicleFormData.capacity),
            category: vehicleFormData.category as MatatuCapacity,
            images: vehicleImages.map((file, index) => ({
                src: `/Uploads/vehicle-${index}.jpg`,
                alt: `Vehicle image ${index + 1}`,
            })),
        });

        setVehicleFormData({ licensePlate: '', capacity: '', category: '' });
        setVehicleImages([]);
        alert('Vehicle added successfully!');
    };

    const handleSendResetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordFormData.email) {
            setPasswordError('Please enter your email address.');
            return;
        }

        try {
            await signIn?.create({
                strategy: 'reset_password_email_code',
                identifier: forgotPasswordFormData.email,
            });
            setSuccessfulCreation(true);
            setPasswordError(null);
            setPasswordSuccess('Password reset code sent to your email.');
        } catch (err: any) {
            console.error('Error sending reset code:', err);
            setPasswordError(err.errors?.[0]?.longMessage || 'Failed to send reset code. Please try again.');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordFormData.code || !forgotPasswordFormData.password) {
            setPasswordError('Please enter the reset code and new password.');
            return;
        }

        try {
            const result = await signIn?.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: forgotPasswordFormData.code,
                password: forgotPasswordFormData.password,
            });

            if (result?.status === 'needs_second_factor') {
                setSecondFactor(true);
                setPasswordError('2FA is required, but this UI does not support it.');
            } else if (result?.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                setPasswordSuccess('Password reset successfully! You are now signed in.');
                setForgotPasswordFormData({ email: '', password: '', code: '' });
                setSuccessfulCreation(false);
                router.push('/dashboard');
            } else {
                console.log('Unexpected result:', result);
                setPasswordError('Failed to reset password. Please try again.');
            }
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setPasswordError(err.errors?.[0]?.longMessage || 'Failed to reset password. Please try again.');
        }
    };

    return (
        <RideLayout title="My Profile">
            <div className="space-y-6">
                <div className="flex items-center justify-center my-5">
                    <Image
                        src={
                            clerkUser?.externalAccounts[0]?.imageUrl ??
                            clerkUser?.imageUrl ??
                            currentUser?.image ??
                            '/images/placeholder.png'
                        }
                        alt="User profile"
                        width={110}
                        height={110}
                        className="rounded-full h-[110px] w-[110px] border-4 border-white shadow-sm shadow-gray-300 object-cover"
                    />
                </div>
                <div className="bg-white rounded-lg p-5">
                    <h2 className="text-xl font-semibold mb-3">Personal Information</h2>
                    <InputField
                        label="Name"
                        placeholder="Enter full name"
                        value={profileFormData.name}
                        onChange={handleProfileInputChange('name')}
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
                    <InputField
                        label="Email"
                        placeholder="Enter email"
                        value={profileFormData.email}
                        onChange={handleProfileInputChange('email')}
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
                    <InputField
                        label="Phone"
                        placeholder="Enter phone number"
                        value={profileFormData.phoneNumber}
                        onChange={handleProfileInputChange('phoneNumber')}
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
                </div>
                <div className="bg-white rounded-lg p-5">
                    <h2 className="text-xl font-semibold mb-3">Add Vehicle</h2>
                    <InputField
                        label="License Plate"
                        placeholder="Enter license plate"
                        value={vehicleFormData.licensePlate}
                        onChange={handleVehicleInputChange('licensePlate')}
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
                    <InputField
                        label="Capacity"
                        placeholder="Enter number of seats"
                        value={vehicleFormData.capacity}
                        onChange={handleVehicleInputChange('capacity')}
                        type="number"
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <Select value={vehicleFormData.category} onValueChange={handleVehicleInputChange('category')}>
                            <SelectTrigger className="w-full border border-gray-300 rounded-lg p-3.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select vehicle category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-300">
                                {Object.keys(matatuConfigs).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {matatuConfigs[key as MatatuCapacity].title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Images</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full border border-gray-300 rounded-lg p-3.5 bg-white text-gray-700"
                        />
                        {vehicleImages.length > 0 && (
                            <p className="text-sm text-gray-600 mt-2">{vehicleImages.length} image(s) selected</p>
                        )}
                    </div>
                    <Button variant="default" size="lg" onClick={handleSaveVehicle} className="w-full">
                        Add Vehicle
                    </Button>
                </div>
                <div className="bg-white rounded-lg p-5">
                    <h2 className="text-xl font-semibold mb-3">Reset Password</h2>
                    <form onSubmit={!successfulCreation ? handleSendResetCode : handleResetPassword}>
                        {!successfulCreation ? (
                            <>
                                <InputField
                                    label="Email Address"
                                    placeholder="e.g. john@doe.com"
                                    value={forgotPasswordFormData.email}
                                    onChange={handleForgotPasswordInputChange('email')}
                                    type="email"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                />
                                <Button variant="default" size="lg" type="submit" className="w-full mt-4">
                                    Send Password Reset Code
                                </Button>
                            </>
                        ) : (
                            <>
                                <InputField
                                    label="New Password"
                                    placeholder="Enter new password"
                                    value={forgotPasswordFormData.password}
                                    onChange={handleForgotPasswordInputChange('password')}
                                    type="password"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                />
                                <InputField
                                    label="Reset Code"
                                    placeholder="Enter the code sent to your email"
                                    value={forgotPasswordFormData.code}
                                    onChange={handleForgotPasswordInputChange('code')}
                                    type="text"
                                    containerStyle="w-full"
                                    inputStyle="p-3.5"
                                />
                                <Button variant="default" size="lg" type="submit" className="w-full mt-4">
                                    Reset Password
                                </Button>
                            </>
                        )}
                        {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-500 text-sm mt-2">{passwordSuccess}</p>}
                        {secondFactor && (
                            <p className="text-yellow-500 text-sm mt-2">
                                2FA is required, but this UI does not support it.
                            </p>
                        )}
                    </form>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6">
                    <Button variant="default" size="lg" onClick={handleSaveProfile} className="w-full">
                        Save Profile
                    </Button>
                </div>
            </div>
        </RideLayout>
    );
};

export default ProfilePage;
