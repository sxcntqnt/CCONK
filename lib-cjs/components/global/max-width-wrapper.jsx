"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@/utils");
const react_1 = __importDefault(require("react"));
const MaxWidthWrapper = ({ className, children }) => {
    return (<section className={(0, utils_1.cn)('mx-auto h-full w-full max-w-full px-4 md:max-w-screen-xl md:px-12 lg:px-20', className)}>
            {children}
        </section>);
};
exports.default = MaxWidthWrapper;
