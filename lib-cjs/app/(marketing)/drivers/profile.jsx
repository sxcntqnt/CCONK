"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_1 = __importDefault(require("next/image"));
const nextjs_1 = require("@clerk/nextjs");
const store_1 = require("@/store");
const navigation_1 = require("next/navigation");
const react_1 = require("react");
// InputField component with editable functionality
const InputField = ({ label, placeholder, value, onChange, containerStyle, inputStyle, type = "text" }) => (<div className={`mb-4 ${containerStyle}`}>
    <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full border border-gray-300 rounded-lg p-3.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputStyle}`}/>
  </div>);
// RideLayout component for consistent styling
const RideLayout = ({ title, children }) => (<div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    {children}
  </div>);
// CustomButton component for save and navigate actions
const CustomButton = ({ title, onPress, disabled }) => (<button className={`w-full py-3 text-white rounded-lg transition ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`} onClick={onPress} disabled={disabled}>
    {title}
  </button>);
const ProfilePage = () => {
    const { user: clerkUser } = (0, nextjs_1.useUser)();
    const { user, updateUser, addVehicle } = (0, store_1.useDriverStore)();
    const router = (0, navigation_1.useRouter)();
    // State for profile form
    const [profileFormData, setProfileFormData] = (0, react_1.useState)({
        firstName: user?.firstName || clerkUser?.firstName || "",
        lastName: user?.lastName || clerkUser?.lastName || "",
        email: user?.emailAddresses?.[0]?.emailAddress || clerkUser?.primaryEmailAddress?.emailAddress || "",
        phone: user?.phoneNumbers?.[0]?.phoneNumber || clerkUser?.primaryPhoneNumber?.phoneNumber || "",
    });
    // State for vehicle form
    const [vehicleFormData, setVehicleFormData] = (0, react_1.useState)({
        licensePlate: "",
        capacity: "",
        category: "",
    });
    const [vehicleImages, setVehicleImages] = (0, react_1.useState)([]);
    // Handle profile input changes
    const handleProfileInputChange = (field) => (value) => {
        setProfileFormData((prev) => ({ ...prev, [field]: value }));
    };
    // Handle vehicle input changes
    const handleVehicleInputChange = (field) => (value) => {
        setVehicleFormData((prev) => ({ ...prev, [field]: value }));
    };
    // Handle image uploads
    const handleImageChange = (e) => {
        if (e.target.files) {
            setVehicleImages((prev) => [...prev, ...Array.from(e.target.files)]);
        }
    };
    // Handle profile save
    const handleSaveProfile = () => {
        updateUser({
            ...user,
            firstName: profileFormData.firstName,
            lastName: profileFormData.lastName,
            emailAddresses: [{ emailAddress: profileFormData.email }],
            phoneNumbers: [{ phoneNumber: profileFormData.phone }],
        });
        alert("Profile updated successfully!");
    };
    // Handle vehicle save
    const handleSaveVehicle = () => {
        if (!vehicleFormData.licensePlate || !vehicleFormData.capacity || !vehicleFormData.category) {
            alert("Please fill all vehicle fields.");
            return;
        }
        addVehicle({
            licensePlate: vehicleFormData.licensePlate,
            capacity: parseInt(vehicleFormData.capacity),
            category: vehicleFormData.category,
            images: vehicleImages.map((file, index) => ({
                src: `/uploads/vehicle-${index}.jpg`, // Placeholder; actual URL from backend
                alt: `Vehicle image ${index + 1}`,
                blurDataURL: null,
            })),
        });
        // Reset form
        setVehicleFormData({ licensePlate: "", capacity: "", category: "" });
        setVehicleImages([]);
        alert("Vehicle added successfully!");
    };
    // Handle navigation to DriversPage
    const handleNavigateToDrivers = () => {
        router.push("/drivers");
    };
    return (<RideLayout title="My Profile">
      <div className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center justify-center my-5">
          <image_1.default src={clerkUser?.externalAccounts[0]?.imageUrl ??
            clerkUser?.imageUrl ??
            user?.profileImageUrl ??
            "/images/placeholder.png"} alt="User profile" width={110} height={110} className="rounded-full h-[110px] w-[110px] border-4 border-white shadow-sm shadow-gray-300 object-cover"/>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg p-5">
          <h2 className="text-xl font-semibold mb-3">Personal Information</h2>
          <InputField label="First name" placeholder="Enter first name" value={profileFormData.firstName} onChange={handleProfileInputChange("firstName")} containerStyle="w-full" inputStyle="p-3.5"/>
          <InputField label="Last name" placeholder="Enter last name" value={profileFormData.lastName} onChange={handleProfileInputChange("lastName")} containerStyle="w-full" inputStyle="p-3.5"/>
          <InputField label="Email" placeholder="Enter email" value={profileFormData.email} onChange={handleProfileInputChange("email")} containerStyle="w-full" inputStyle="p-3.5"/>
          <InputField label="Phone" placeholder="Enter phone number" value={profileFormData.phone} onChange={handleProfileInputChange("phone")} containerStyle="w-full" inputStyle="p-3.5"/>
        </div>

        {/* Vehicle Form */}
        <div className="bg-white rounded-lg p-5">
          <h2 className="text-xl font-semibold mb-3">Add Vehicle</h2>
          <InputField label="License Plate" placeholder="Enter license plate" value={vehicleFormData.licensePlate} onChange={handleVehicleInputChange("licensePlate")} containerStyle="w-full" inputStyle="p-3.5"/>
          <InputField label="Capacity" placeholder="Enter number of seats" value={vehicleFormData.capacity} onChange={handleVehicleInputChange("capacity")} type="number" containerStyle="w-full" inputStyle="p-3.5"/>
          <InputField label="Category" placeholder="Enter vehicle category (e.g., Minibus, Coach)" value={vehicleFormData.category} onChange={handleVehicleInputChange("category")} containerStyle="w-full" inputStyle="p-3.5"/>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Vehicle Images</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="w-full border border-gray-300 rounded-lg p-3.5 bg-white text-gray-700"/>
            {vehicleImages.length > 0 && (<p className="text-sm text-gray-600 mt-2">{vehicleImages.length} image(s) selected</p>)}
          </div>
          <CustomButton title="Add Vehicle" onPress={handleSaveVehicle}/>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-6">
          <CustomButton title="Save Profile" onPress={handleSaveProfile}/>
          <CustomButton title="View Drivers" onPress={handleNavigateToDrivers}/>
        </div>
      </div>
    </RideLayout>);
};
exports.default = ProfilePage;
