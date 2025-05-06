// config/nav-items.ts
import { BarChart2, Car, Users, Calendar, User, Fuel, Bell, DollarSign, MapPin, Shield, FileText, Settings, UserCog, Lock, LogOut, } from 'lucide-react';
export const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2, position: 'main' },
    { name: 'Vehicle', path: '/vehicle', icon: Car, position: 'main' },
    { name: 'Drivers', path: '/drivers', icon: Users, position: 'main' },
    { name: 'Reservations', path: '/reservations', icon: Calendar, position: 'main' },
    { name: 'Customer', path: '/customer', icon: User, position: 'main' },
    { name: 'Fuel', path: '/fuel', icon: Fuel, position: 'main' },
    { name: 'Reminder', path: '/reminder', icon: Bell, position: 'main' },
    { name: 'Income & Expenses', path: '/income-expenses', icon: DollarSign, position: 'main' },
    { name: 'Tracking', path: '/tracking', icon: MapPin, position: 'main' },
    { name: 'Geofence', path: '/geofence', icon: Shield, position: 'main' },
    { name: 'Reports', path: '/reports', icon: FileText, position: 'main' },
    { name: 'Users', path: '/users', icon: UserCog, position: 'main' },
    { name: 'Change Password', path: '/changepassword', icon: Lock, position: 'main' },
    { name: 'Settings', path: '/settings', icon: Settings, position: 'bottom' },
    { name: 'Logout', path: '/logout', icon: LogOut, position: 'bottom' },
];
// Function to filter nav items based on role
export const getNavItemsByRole = (role) => {
    switch (role) {
        case 'OWNER':
            return navItems; // Owner sees all items
        case 'PASSENGER':
            return navItems.filter((item) => [
                'Dashboard',
                'Vehicle',
                'Reservations',
                'Geofence',
                'Tracking',
                'Change Password',
                'Settings',
                'Logout',
            ].includes(item.name));
        case 'DRIVER':
            return navItems.filter((item) => ['Dashboard', 'Vehicle', 'Fuel', 'Reminder', 'Change Password', 'Settings', 'Logout'].includes(item.name));
        default:
            return [];
    }
};
