"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const components_1 = require("@/components");
const utils_1 = require("@/utils");
const Logo = ({ variant = 'icon', className }) => {
    return (<>
            {variant === 'icon' ? (<components_1.Icons.logo className={(0, utils_1.cn)('h-8 w-8 transition-all', className)}/>) : variant === 'text' ? (<components_1.Icons.wordmark className={(0, utils_1.cn)('h-5 w-auto transition-all', className)}/>) : (<div className={(0, utils_1.cn)('flex h-8 w-auto items-center space-x-2 transition-all', className)}>
                    <components_1.Icons.logo className="h-8 w-8 transition-all"/>
                    <components_1.Icons.wordmark className="h-5 w-auto transition-all"/>
                </div>)}
        </>);
};
exports.default = Logo;
