"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const framer_motion_1 = require("framer-motion");
const AnimationContainer = ({ children, className, reverse, delay }) => {
    return (<framer_motion_1.motion.div className={className} initial={{ opacity: 0, y: reverse ? -20 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{
            duration: 0.2,
            delay: delay,
            ease: 'easeInOut',
            type: 'spring',
            stiffness: 260,
            damping: 20,
        }}>
            {children}
        </framer_motion_1.motion.div>);
};
exports.default = AnimationContainer;
