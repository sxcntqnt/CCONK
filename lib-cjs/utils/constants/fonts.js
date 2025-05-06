"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inter = exports.aeonik = void 0;
const google_1 = require("next/font/google");
const local_1 = __importDefault(require("next/font/local"));
exports.aeonik = (0, local_1.default)({
    src: [
        {
            path: '../../../public/fonts/AeonikPro-Light.woff2',
            weight: '300',
        },
        {
            path: '../../../public/fonts/AeonikPro-Regular.woff2',
            weight: '400',
        },
        {
            path: '../../../public/fonts/AeonikPro-Medium.woff2',
            weight: '500',
        },
        {
            path: '../../../public/fonts/AeonikPro-Bold.woff2',
            weight: '700',
        },
        {
            path: '../../../public/fonts/AeonikPro-Black.woff2',
            weight: '900',
        },
    ],
    variable: '--font-aeonik',
});
exports.inter = (0, google_1.Inter)({
    subsets: ['latin'],
    variable: '--font-inter',
});
