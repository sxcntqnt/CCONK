// src/components/ui/ThemeSwitcher.tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Define the props interface
interface ThemeSwitcherProps {
    onThemeChange?: () => void; // Optional callback for theme change
}

export function ThemeSwitcher({ onThemeChange }: ThemeSwitcherProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted before rendering to avoid hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // Prevent rendering until mounted
    }

    return (
        <select
            value={theme}
            onChange={(e) => {
                const newTheme = e.target.value;
                setTheme(newTheme);
                localStorage.setItem('theme', newTheme); // Save to localStorage
                if (onThemeChange) {
                    onThemeChange(); // Call the callback when theme changes
                }
            }}
        >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
        </select>
    );
}
