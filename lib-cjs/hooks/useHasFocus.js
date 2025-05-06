"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHasFocus = useHasFocus;
const react_1 = require("react");
function useHasFocus(elementRef) {
    const [value, setValue] = (0, react_1.useState)(false);
    const handleFocusIn = () => {
        setValue(true);
    };
    const handleFocusOut = () => {
        setValue(false);
    };
    (0, react_1.useEffect)(() => {
        elementRef.current?.addEventListener('focusin', handleFocusIn);
        elementRef.current?.addEventListener('focusout', handleFocusOut);
        return () => {
            elementRef.current?.removeEventListener('focusin', handleFocusIn);
            elementRef.current?.removeEventListener('focusout', handleFocusOut);
            handleFocusOut();
        };
    }, [elementRef.current]);
    return value;
}
