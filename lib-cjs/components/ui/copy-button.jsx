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
const utils_1 = require("@/utils");
const lucide_react_1 = require("lucide-react");
const react_1 = __importStar(require("react"));
const sonner_1 = require("sonner");
const CopyButton = ({ text, className, icon }) => {
    const [isCopied, setIsCopied] = (0, react_1.useState)(false);
    const Comp = icon || lucide_react_1.Copy;
    const handleClick = (e) => {
        e.stopPropagation();
        setIsCopied(true);
        navigator.clipboard.writeText(text).then(() => {
            sonner_1.toast.success('Copied to clipboard!');
        });
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };
    return (<button className={(0, utils_1.cn)('group flex items-center justify-center rounded-md bg-foreground/10 p-2 transition-all duration-100 hover:scale-105 hover:bg-foreground/20 active:scale-95', className)}>
            <span className="sr-only">Copy</span>
            {isCopied ? (<lucide_react_1.Check className="text-neutral-700 group-hover:text-accent"/>) : (<Comp className="text-neutral-700 group-hover:text-foreground"/>)}
        </button>);
};
exports.default = CopyButton;
