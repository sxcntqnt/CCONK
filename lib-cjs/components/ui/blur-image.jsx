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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@/utils");
const image_1 = __importDefault(require("next/image"));
const react_1 = __importStar(require("react"));
const BlurImage = ({ src, alt, className, ...props }) => {
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [url, setUrl] = (0, react_1.useState)(src);
    const handleLoad = (e) => {
        setIsLoading(false);
        const target = e.target;
        if (target.naturalWidth <= 32 && target.naturalHeight <= 32) {
            setUrl(`https://github.com/shadcn.png`);
        }
    };
    (0, react_1.useEffect)(() => {
        setUrl(src);
    }, [src]);
    return (<image_1.default {...props} src={src} alt={alt} unoptimized onLoad={handleLoad} className={(0, utils_1.cn)(isLoading ? 'blur-sm filter' : 'blur-0', className)}/>);
};
exports.default = BlurImage;
