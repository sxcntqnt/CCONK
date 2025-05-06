"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/(marketing)/layout.tsx
const react_1 = __importDefault(require("react"));
const components_1 = require("@/components");
const utils_1 = require("@/utils");
const MarketingLayout = ({ children }) => {
    return (<div className="flex flex-col min-h-screen relative">
            {/* Decorative Background Grid */}
            <div id="home" className="absolute inset-0 min-h-screen bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[length:24px_24px]"/>
            {/* Navbar */}
            <components_1.Navbar className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--background))]"/>
            {/* Main Content with Functional Grid */}
            <main className={(0, utils_1.cn)('relative z-0 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-min')}>
                {children}
            </main>
            {/* Footer */}
            <components_1.Footer className="z-10 bg-[hsl(var(--background))]"/>
        </div>);
};
exports.default = MarketingLayout;
