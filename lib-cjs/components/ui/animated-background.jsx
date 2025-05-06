"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedBackground = AnimatedBackground;
const utils_1 = require("@/utils");
const framer_motion_1 = require("framer-motion");
const react_1 = require("react");
function AnimatedBackground({ width = 40, height = 40, x = -1, y = -1, strokeDasharray = 0, numSquares = 50, className, maxOpacity = 0.5, duration = 4, repeatDelay = 0.5, ...props }) {
    const id = (0, react_1.useId)();
    const containerRef = (0, react_1.useRef)(null);
    const [dimensions, setDimensions] = (0, react_1.useState)({ width: 0, height: 0 });
    const [squares, setSquares] = (0, react_1.useState)(() => generateSquares(numSquares));
    function getPos() {
        return [
            Math.floor((Math.random() * dimensions.width) / width),
            Math.floor((Math.random() * dimensions.height) / height),
        ];
    }
    // Adjust the generateSquares function to return objects with an id, x, and y
    function generateSquares(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            pos: getPos(),
        }));
    }
    // Function to update a single square's position
    const updateSquarePosition = (id) => {
        setSquares((currentSquares) => currentSquares.map((sq) => sq.id === id
            ? {
                ...sq,
                pos: getPos(),
            }
            : sq));
    };
    // Update squares to animate in
    (0, react_1.useEffect)(() => {
        if (dimensions.width && dimensions.height) {
            setSquares(generateSquares(numSquares));
        }
    }, [dimensions, numSquares]);
    // Resize observer to update container dimensions
    (0, react_1.useEffect)(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => {
            if (containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
            }
        };
    }, [containerRef]);
    return (<svg ref={containerRef} aria-hidden="true" className={(0, utils_1.cn)('pointer-events-none absolute inset-0 h-full w-full fill-[rgba(0,0,0,0.01)] stroke-muted-foreground/20', className)} {...props}>
            <defs>
                <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
                    <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray}/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`}/>
            <svg x={x} y={y} className="overflow-visible">
                {squares.map(({ pos: [x, y], id }, index) => (<framer_motion_1.motion.rect initial={{ opacity: 0 }} animate={{ opacity: maxOpacity }} transition={{
                duration,
                repeat: 1,
                delay: index * 0.1,
                repeatType: 'reverse',
            }} onAnimationComplete={() => updateSquarePosition(id)} key={`${x}-${y}-${index}`} width={width - 1} height={height - 1} x={x * width + 1} y={y * height + 1} fill="currentColor" strokeWidth="0"/>))}
            </svg>
        </svg>);
}
exports.default = AnimatedBackground;
