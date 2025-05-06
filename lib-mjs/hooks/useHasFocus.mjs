import { useEffect, useState } from 'react';
export function useHasFocus(elementRef) {
    const [value, setValue] = useState(false);
    const handleFocusIn = () => {
        setValue(true);
    };
    const handleFocusOut = () => {
        setValue(false);
    };
    useEffect(() => {
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
