"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsVisible = useIsVisible;
const react_1 = require("react");
function useIsVisible(elementRef) {
    const [isIntersecting, setIntersecting] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));
        observer.observe(elementRef.current);
        return () => {
            observer.disconnect();
        };
    }, [elementRef]);
    return isIntersecting;
}
