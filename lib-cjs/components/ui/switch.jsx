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
exports.TriStateSwitch = void 0;
const React = __importStar(require("react"));
const SwitchPrimitives = __importStar(require("@radix-ui/react-switch"));
const utils_1 = require("@/utils");
const STATES = ['off', 'intermediate', 'on'];
const TriStateSwitch = React.forwardRef(({ className, ...props }, ref) => {
    const [state, setState] = React.useState(0); // 0 = off, 1 = intermediate, 2 = on
    const handleClick = () => {
        setState((prev) => (prev + 1) % 3);
    };
    return (<div className="flex items-center gap-2">
            <span className="text-sm">{STATES[state]}</span>
            <SwitchPrimitives.Root className={(0, utils_1.cn)('relative flex h-6 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50', state === 0 ? 'bg-gray-300' : state === 1 ? 'bg-yellow-400' : 'bg-green-500', className)} onClick={handleClick} {...props} ref={ref}>
                <SwitchPrimitives.Thumb className={(0, utils_1.cn)('pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform', state === 0 ? 'translate-x-0' : state === 1 ? 'translate-x-4' : 'translate-x-8')}/>
            </SwitchPrimitives.Root>
        </div>);
});
exports.TriStateSwitch = TriStateSwitch;
TriStateSwitch.displayName = 'TriStateSwitch';
