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
exports.TextHoverEffect = void 0;
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const TextHoverEffect = ({ text, duration }) => {
    const svgRef = (0, react_1.useRef)(null);
    const [cursor, setCursor] = (0, react_1.useState)({ x: 0, y: 0 });
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const [maskPosition, setMaskPosition] = (0, react_1.useState)({ cx: '50%', cy: '50%' });
    (0, react_1.useEffect)(() => {
        if (svgRef.current && cursor.x !== null && cursor.y !== null) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
            const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
            setMaskPosition({
                cx: `${cxPercentage}%`,
                cy: `${cyPercentage}%`,
            });
        }
    }, [cursor]);
    return (<svg ref={svgRef} width="100%" height="100%" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })} className="select-none">
            <defs>
                <linearGradient id="textGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
                    {hovered && (<>
                            <stop offset="0%" stopColor={'var(--indigo-500)'}/>
                            <stop offset="25%" stopColor={'var(--violet-500)'}/>
                            <stop offset="50%" stopColor={'var(--purple-500)'}/>
                            <stop offset="75%" stopColor={'var(--fuchsia-500)'}/>
                            <stop offset="100%" stopColor={'var(--rose-500)'}/>
                        </>)}
                </linearGradient>

                <framer_motion_1.motion.radialGradient id="revealMask" gradientUnits="userSpaceOnUse" r="20%" animate={maskPosition} transition={{ duration: duration ?? 0, ease: 'easeOut' }}>
                    <stop offset="0%" stopColor="white"/>
                    <stop offset="100%" stopColor="black"/>
                </framer_motion_1.motion.radialGradient>
                <mask id="textMask">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)"/>
                </mask>
            </defs>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" strokeWidth="0.3" className="fill-transparent stroke-neutral-800 font-[helvetica] text-7xl font-bold" style={{ opacity: hovered ? 0.7 : 0 }}>
                {text}
            </text>
            <framer_motion_1.motion.text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" strokeWidth="0.3" className="fill-transparent stroke-neutral-800 font-[helvetica] text-7xl font-bold" initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }} animate={{
            strokeDashoffset: 0,
            strokeDasharray: 1000,
        }} transition={{
            duration: 4,
            ease: 'easeInOut',
        }}>
                {text}
            </framer_motion_1.motion.text>
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" stroke="url(#textGradient)" strokeWidth="0.3" mask="url(#textMask)" className="fill-transparent font-[helvetica] text-7xl font-bold">
                {text}
            </text>
        </svg>);
};
exports.TextHoverEffect = TextHoverEffect;
