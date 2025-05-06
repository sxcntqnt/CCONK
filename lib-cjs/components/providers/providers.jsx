"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const nextjs_1 = require("@clerk/nextjs");
const react_query_1 = require("@tanstack/react-query");
const sidebar_1 = require("@/components/ui/sidebar");
const tooltip_1 = require("@/components/ui/tooltip");
const react_2 = require("@knocklabs/react");
const next_themes_1 = require("next-themes");
require("@knocklabs/react/dist/index.css");
const KNOCK_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY || '';
const InnerProviders = ({ children }) => {
    const { user, isLoaded: userLoaded, isSignedIn } = (0, nextjs_1.useUser)();
    const { getToken } = (0, nextjs_1.useAuth)();
    const { setTheme } = (0, next_themes_1.useTheme)();
    const [knockToken, setKnockToken] = react_1.default.useState(null);
    const [error, setError] = react_1.default.useState(null);
    (0, react_1.useEffect)(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, [setTheme]);
    (0, react_1.useEffect)(() => {
        async function fetchToken() {
            try {
                const token = await getToken();
                if (token) {
                    setKnockToken(token);
                }
                else {
                    setError('No Clerk token available');
                }
            }
            catch (err) {
                console.error('Failed to fetch Clerk token:', err);
                setError('Failed to fetch Clerk token');
            }
        }
        if (userLoaded && isSignedIn && user?.id) {
            fetchToken();
        }
    }, [userLoaded, isSignedIn, user?.id, getToken]);
    const commonProviders = (<next_themes_1.ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <sidebar_1.SidebarProvider>
                <tooltip_1.TooltipProvider>{children}</tooltip_1.TooltipProvider>
            </sidebar_1.SidebarProvider>
        </next_themes_1.ThemeProvider>);
    if (!userLoaded) {
        return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
    }
    if (error) {
        return (<div className="flex items-center justify-center min-h-screen">
                Error: {error} <button onClick={() => setError(null)}>Retry</button>
            </div>);
    }
    if (!isSignedIn || !user?.id || !knockToken) {
        return commonProviders;
    }
    return (<react_2.KnockProvider apiKey={KNOCK_PUBLIC_API_KEY} userId={user.id} userToken={knockToken}>
            {commonProviders}
        </react_2.KnockProvider>);
};
const Providers = ({ children }) => {
    const queryClient = new react_query_1.QueryClient();
    return (<react_query_1.QueryClientProvider client={queryClient}>
            <react_1.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <InnerProviders>{children}</InnerProviders>
            </react_1.Suspense>
        </react_query_1.QueryClientProvider>);
};
exports.default = Providers;
