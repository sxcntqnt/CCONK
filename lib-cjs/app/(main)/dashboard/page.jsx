"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
// src/app/(main)/dashboard/page.tsx
const server_1 = require("@clerk/nextjs/server");
const navigation_1 = require("next/navigation");
const roles_1 = require("@/utils/constants/roles");
async function DashboardPage({ searchParams }) {
    const user = await (0, server_1.currentUser)();
    if (!user) {
        (0, navigation_1.redirect)('/auth/sign-in');
    }
    // Resolve searchParams safely
    const resolvedSearchParams = await searchParams;
    const roleFromMetadata = user?.unsafeMetadata?.role?.toUpperCase().trim();
    const roleFromQuery = resolvedSearchParams.role?.toUpperCase().trim();
    const role = roleFromQuery || roleFromMetadata || roles_1.ROLES.PASSENGER;
    // If no role is specified, redirect to home
    if (!role) {
        (0, navigation_1.redirect)('/');
    }
    // Redirect based on role
    switch (role) {
        case roles_1.ROLES.PASSENGER:
            return (0, navigation_1.redirect)('/dashboard/passenger');
        case roles_1.ROLES.DRIVER:
            return (0, navigation_1.redirect)('/dashboard/driver');
        case roles_1.ROLES.OWNER:
            return (0, navigation_1.redirect)('/dashboard/owner');
        default:
            // Unknown role redirects to home
            (0, navigation_1.redirect)('/');
    }
}
