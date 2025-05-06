"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/(main)/dashboard/layout.tsx
const react_1 = __importDefault(require("react"));
const components_1 = require("@/components");
const appSidebar_1 = __importDefault(require("@/components/dashboard/appSidebar"));
const utils_1 = require("@/utils");
const roles_1 = require("@/utils/constants/roles");
const server_1 = require("@clerk/nextjs/server");
const DashboardLayout = async ({ children }) => {
    const user = await (0, server_1.currentUser)();
    const rawRole = user?.unsafeMetadata.role;
    const role = rawRole?.toUpperCase().trim() || roles_1.ROLES.PASSENGER;
    return (<div className="flex flex-col min-h-screen bg-background text-foreground">
            <components_1.Navbar />
            <div className="flex flex-1 relative">
                <div id="home" className={(0, utils_1.cn)('absolute inset-0 h-full bg-grid bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] z-[-1] opacity-50', 'dark:bg-grid dark:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]')}/>
                <appSidebar_1.default role={role} className="sticky top-20 h-[calc(100vh-5rem)] z-10"/>
                <main className="flex-1 relative z-0 p-6">{children}</main>
            </div>
            <components_1.Footer />
        </div>);
};
exports.default = DashboardLayout;
