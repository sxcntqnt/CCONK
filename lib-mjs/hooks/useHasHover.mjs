import { useEffect, useState } from 'react';
export function useHover(elementRef) {
    const [value, setValue] = useState(false);
    const handleMouseEnter = () => {
        setValue(true);
    };
    const handleMouseLeave = () => {
        setValue(false);
    };
    useEffect(() => {
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
