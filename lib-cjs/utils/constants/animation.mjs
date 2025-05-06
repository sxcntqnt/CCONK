"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FADE_IN_VARIANTS = exports.MODAL_VARIANTS = exports.CHILD_VARIANTS = exports.LIST_ITEM_VARIANTS = void 0;
exports.LIST_ITEM_VARIANTS = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring' } },
};
exports.CHILD_VARIANTS = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring' } },
};
exports.MODAL_VARIANTS = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring' } },
};
exports.FADE_IN_VARIANTS = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
};
