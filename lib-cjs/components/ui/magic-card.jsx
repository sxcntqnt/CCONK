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
const react_1 = __importStar(require("react"));
const MagicCard = ({ children, className }) => {
    const divRef = (0, react_1.useRef)(null);
    const [isFocused, setIsFocused] = (0, react_1.useState)(false);
    const [position, setPosition] = (0, react_1.useState)({ x: 0, y: 0 });
    const [opacity, setOpacity] = (0, react_1.useState)(0);
    const handleMouseMove = (e) => {
        if (!divRef.current || isFocused)
            return;
        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };
    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };
    const handleMouseEnter = () => {
        setOpacity(1);
    };
    const handleMouseLeave = () => {
        setOpacity(0);
    };
    return (<div ref={divRef} onMouseMove={handleMouseMove} onFocus={handleFocus} onBlur={handleBlur} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={(0, utils_1.cn)('relative max-w-md overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-background to-background/40 p-4 md:p-6', className)}>
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-300" style={{
            opacity,
            background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(168,85,247,.15), transparent 60%)`,
        }}/>
            {children}
        </div>);
};
exports.default = MagicCard;
