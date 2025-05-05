"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const navigation_1 = require("next/navigation");
const usehooks_ts_1 = require("usehooks-ts");
const dialog_1 = require("./dialog");
const drawer_1 = require("./drawer");
const Modal = ({ children, isOpen, setIsOpen, onClose }) => {
    const router = (0, navigation_1.useRouter)();
    const handleClose = ({ dragged }) => {
        onClose && onClose();
        if (isOpen) {
            setIsOpen(false);
        }
        else {
            router.back();
        }
    };
    const isDesktop = (0, usehooks_ts_1.useMediaQuery)('(max-width: 768px)');
    if (isDesktop) {
        return (<dialog_1.Dialog open={isOpen} onOpenChange={setIsOpen}>
                {children}
            </dialog_1.Dialog>);
    }
    return (<drawer_1.Drawer open={isOpen} onOpenChange={setIsOpen} direction="bottom">
            {children}
        </drawer_1.Drawer>);
};
exports.default = Modal;
