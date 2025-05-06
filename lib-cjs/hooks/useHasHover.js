"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHover = useHover;
const react_1 = require("react");
function useHover(elementRef) {
    const [value, setValue] = (0, react_1.useState)(false);
    const handleMouseEnter = () => {
        setValue(true);
    };
    const handleMouseLeave = () => {
        setValue(false);
    };
    (0, react_1.useEffect)(() => {
        elementRef.current?.addEventListener('mouseenter', handleMouseEnter);
        elementRef.current?.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            elementRef.current?.removeEventListener('mouseenter', handleMouseEnter);
            elementRef.current?.removeEventListener('mouseleave', handleMouseLeave);
            handleMouseLeave();
        };
    }, [elementRef.current]);
    return value;
}
