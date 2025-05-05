"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavItemsByRole = exports.navItems = void 0;
// config/nav-items.ts
const lucide_react_1 = require("lucide-react");
exports.navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: lucide_react_1.BarChart2, position: 'main' },
    { name: 'Vehicle', path: '/vehicle', icon: lucide_react_1.Car, position: 'main' },
    { name: 'Drivers', path: '/drivers', icon: lucide_react_1.Users, position: 'main' },
    { name: 'Reservations', path: '/reservations', icon: lucide_react_1.Calendar, position: 'main' },
    { name: 'Customer', path: '/customer', icon: lucide_react_1.User, position: 'main' },
    { name: 'Fuel', path: '/fuel', icon: lucide_react_1.Fuel, position: 'main' },
    { name: 'Reminder', path: '/reminder', icon: lucide_react_1.Bell, position: 'main' },
    { name: 'Income & Expenses', path: '/income-expenses', icon: lucide_react_1.DollarSign, position: 'main' },
    { name: 'Tracking', path: '/tracking', icon: lucide_react_1.MapPin, position: 'main' },
    { name: 'Geofence', path: '/geofence', icon: lucide_react_1.Shield, position: 'main' },
    { name: 'Reports', path: '/reports', icon: lucide_react_1.FileText, position: 'main' },
    { name: 'Users', path: '/users', icon: lucide_react_1.UserCog, position: 'main' },
    { name: 'Change Password', path: '/changepassword', icon: lucide_react_1.Lock, position: 'main' },
    { name: 'Settings', path: '/settings', icon: lucide_react_1.Settings, position: 'bottom' },
    { name: 'Logout', path: '/logout', icon: lucide_react_1.LogOut, position: 'bottom' },
];
// Function to filter nav items based on role
const getNavItemsByRole = (role) => {
    switch (role) {
        case 'OWNER':
            return exports.navItems; // Owner sees all items
        case 'PASSENGER':
            return exports.navItems.filter((item) => [
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
            return exports.navItems.filter((item) => ['Dashboard', 'Vehicle', 'Fuel', 'Reminder', 'Change Password', 'Settings', 'Logout'].includes(item.name));
        default:
            return [];
    }
};
exports.getNavItemsByRole = getNavItemsByRole;
