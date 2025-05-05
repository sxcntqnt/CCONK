"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const actions_1 = require("@/actions");
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const AuthCallbackPage = () => {
    const router = (0, navigation_1.useRouter)();
    const { data, isLoading, error } = (0, react_query_1.useQuery)({
        queryKey: ['auth-status'],
        queryFn: async () => {
            console.log('AuthCallbackPage - Running getAuthStatus');
            return await (0, actions_1.getAuthStatus)();
        },
        enabled: true,
        retry: 5, // Limited retries to avoid infinite loops
        retryDelay: 1000,
    });
    (0, react_1.useEffect)(() => {
        if (data?.success) {
            console.log('AuthCallbackPage - Auth successful, redirecting to dashboard');
            router.push('/dashboard');
        }
        else if (error || (data && !data.success)) {
            console.log('AuthCallbackPage - Auth failed, redirecting to sign-in');
            router.push('/auth/sign-in?error=auth-callback-failed');
        }
    }, [data, error, router]);
    if (isLoading) {
        return (<div className="flex items-center justify-center flex-col h-screen relative">
                <div className="border-[3px] border-neutral-800 rounded-full border-b-neutral-200 animate-loading w-8 h-8"></div>
                <p className="text-lg font-medium text-center mt-3">Verifying your account...</p>
            </div>);
    }
    return null;
};
exports.default = AuthCallbackPage;
