"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OwnerDashboard;
// src/app/(main)/dashboard/owner/page.tsx
const server_1 = require("@clerk/nextjs/server");
const navigation_1 = require("next/navigation");
const ownerUtils_1 = require("./ownerUtils");
const clientOwnerDashboard_1 = __importDefault(require("./clientOwnerDashboard"));
const roles_1 = require("@/utils/constants/roles");
async function OwnerDashboard() {
    const user = await (0, server_1.currentUser)();
    if (!user) {
        (0, navigation_1.redirect)('/auth/sign-in');
    }
    // Log raw metadata for debugging
    const rawRole = user.unsafeMetadata.role; // Changed from publicMetadata
    const role = rawRole?.toUpperCase().trim();
    if (!role) {
        (0, navigation_1.redirect)('/');
    }
    switch (role) {
        case roles_1.ROLES.PASSENGER:
            (0, navigation_1.redirect)('/dashboard/passenger');
        case roles_1.ROLES.DRIVER:
            (0, navigation_1.redirect)('/dashboard/driver');
        case roles_1.ROLES.OWNER:
            break;
        default:
            (0, navigation_1.redirect)('/');
    }
    let ownerData;
    try {
        ownerData = await (0, ownerUtils_1.getOwnerData)(user.id);
    }
    catch (error) {
        return (<div className="container mx-auto py-8">
                <p>{error instanceof Error ? error.message : 'Failed to load owner data'}</p>
            </div>);
    }
    const { trips, buses, drivers, reservations, incomeExpenses, geofences, reports, users } = ownerData;
    return (<clientOwnerDashboard_1.default user={user} trips={trips} buses={buses} drivers={drivers} reservations={reservations} incomeExpenses={incomeExpenses} geofences={geofences} reports={reports} users={users} role={role}/>);
}
