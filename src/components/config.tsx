// config/nav-items.ts
import {
    BarChart2,
    Car,
    Users,
    Calendar,
    User,
    Fuel,
    Bell,
    DollarSign,
    MapPin,
    Shield,
    FileText,
    Settings,
    UserCog,
    Lock,
    LogOut,
} from 'lucide-react';

export interface NavItem {
    name: string;
    path: string;
    icon: any; // You could use a more specific type from lucide-react
    active?: boolean;
    position: 'main' | 'bottom';
}

export const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart2, position: 'main' },
    { name: 'Vehicle', path: '/dashboard/vehicles', icon: Car, position: 'main' },
    { name: 'Drivers', path: '/dashboard/drivers', icon: Users, position: 'main' },
    { name: 'Reservations', path: '/dashboard/reserve', icon: Calendar, position: 'main' },
    { name: 'Customer', path: '/dashboard/profile', icon: User, position: 'main' },
    { name: 'Fuel', path: '/dashboard/fuel', icon: Fuel, position: 'main' },
    { name: 'Reminder', path: '/dashboard/reminder', icon: Bell, position: 'main' },
    { name: 'Income & Expenses', path: '/dashboard/income-expenses', icon: DollarSign, position: 'main' },
    { name: 'Tracking', path: '/dashboard/tracking', icon: MapPin, position: 'main' },
    { name: 'Geofence', path: '/dashboard/geofences', icon: Shield, position: 'main' },
    { name: 'Reports', path: '/dashboard/reports', icon: FileText, position: 'main' },
    { name: 'Chat', path: '/dashboard/chat', icon: UserCog, position: 'main' },
    { name: 'Settings', path: '/settings', icon: Settings, position: 'bottom' },
    { name: 'Logout', path: '/logout', icon: LogOut, position: 'bottom' },
];

// Function to filter nav items based on role
export const getNavItemsByRole = (role: 'OWNER' | 'PASSENGER' | 'DRIVER'): NavItem[] => {
    switch (role) {
        case 'OWNER':
            return navItems; // Owner sees all items
        case 'PASSENGER':
            return navItems.filter((item) =>
                ['Dashboard', 'Vehicle', 'Reservations', 'Geofence', 'Tracking', 'Chat', 'Settings', 'Logout'].includes(
                    item.name,
                ),
            );
        case 'DRIVER':
            return navItems.filter((item) =>
                ['Dashboard', 'Vehicle', 'Fuel', 'Reminder', 'Change Password', 'Settings', 'Logout'].includes(
                    item.name,
                ),
            );
        default:
            return [];
    }
};
