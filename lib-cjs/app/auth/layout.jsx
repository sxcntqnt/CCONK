"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("@/components");
const sonner_1 = require("@/components/ui/sonner");
const react_1 = __importDefault(require("react"));
const MarketingLayout = ({ children }) => {
    return (<components_1.MaxWidthWrapper>
            <sonner_1.Toaster richColors theme="dark" position="top-right"/>
            <main className="relative mx-auto w-full">{children}</main>
        </components_1.MaxWidthWrapper>);
};
exports.default = MarketingLayout;
