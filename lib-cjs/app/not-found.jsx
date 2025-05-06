"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const button_1 = require("@/components/ui/button");
const link_1 = __importDefault(require("next/link"));
const NotFound = () => {
    return (<main className="relative flex flex-col items-center justify-center px-4">
            <components_1.Navbar />
            <div className="mx-auto flex h-screen flex-col items-center justify-center">
                <div className="flex h-full flex-col items-center justify-center">
                    <span className="not-found rounded-md bg-gradient-to-br from-violet-400 to-purple-600 px-3.5 py-1 text-sm font-medium text-neutral-50">
                        404
                    </span>
                    <h1 className="mt-5 text-3xl font-bold text-neutral-50 md:text-5xl">Not Found</h1>
                    <p className="mx-auto mt-5 max-w-xl text-center text-base font-medium text-neutral-400">
                        The page you are looking for does not exist. <br /> But don&apos;t worry, we&apos;ve got you
                        covered. You can{' '}
                        <link_1.default href="/resources/help" className="text-foreground">
                            contact us
                        </link_1.default>
                        .
                    </p>
                    <link_1.default href="/" legacyBehavior>
                        <button_1.Button className="mt-8">Back to homepage</button_1.Button>
                    </link_1.default>
                </div>
            </div>
            <components_1.Footer />
        </main>);
};
exports.default = NotFound;
