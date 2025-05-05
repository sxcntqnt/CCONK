'use client';

import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useUserStore, useBusStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
        <input
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

const CustomButton: React.FC<{
    title: string;
    onPress: () => void;
    disabled?: boolean;
}> = ({ title, onPress, disabled }) => (
    <button
        className={`w-full py-3 text-white rounded-lg transition-colors ${
            disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={onPress}
        disabled={disabled}
    >
        {title}
    </button>
);

const ProfilePage = () => {
    const { user: clerkUser } = useUser();
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
        category: '',
    });
    const [vehicleImages, setVehicleImages] = useState<File[]>([]);

    const handleProfileInputChange = (field: keyof typeof profileFormData) => (value: string) => {
        setProfileFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVehicleInputChange = (field: keyof typeof vehicleFormData) => (value: string) => {
        setVehicleFormData((prev) => ({ ...prev, [field]: value }));
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
            category: vehicleFormData.category,
            images: vehicleImages.map((file, index) => ({
                src: `/Uploads/vehicle-${index}.jpg`,
                alt: `Vehicle image ${index + 1}`,
            })),
        });

        setVehicleFormData({ licensePlate: '', capacity: '', category: '' });
        setVehicleImages([]);
        alert('Vehicle added successfully!');
    };

    const handleNavigateToDrivers = () => {
        router.push('/drivers');
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
                    <InputField
                        label="Category"
                        placeholder="Enter vehicle category (e.g., Minibus, Coach)"
                        value={vehicleFormData.category}
                        onChange={handleVehicleInputChange('category')}
                        containerStyle="w-full"
                        inputStyle="p-3.5"
                    />
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
                    <CustomButton title="Add Vehicle" onPress={handleSaveVehicle} />
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6">
                    <CustomButton title="Save Profile" onPress={handleSaveProfile} />
                    <CustomButton title="View Drivers" onPress={handleNavigateToDrivers} />
                </div>
            </div>
        </RideLayout>
    );
};

export default ProfilePage;
