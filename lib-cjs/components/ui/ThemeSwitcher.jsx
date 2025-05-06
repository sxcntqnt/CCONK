"use strict";
// src/components/ui/ThemeSwitcher.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeSwitcher = ThemeSwitcher;
const next_themes_1 = require("next-themes");
const react_1 = require("react");
function ThemeSwitcher({ onThemeChange }) {
    const { theme, setTheme } = (0, next_themes_1.useTheme)();
    const [mounted, setMounted] = (0, react_1.useState)(false);
    // Ensure component is mounted before rendering to avoid hydration issues
    (0, react_1.useEffect)(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return null; // Prevent rendering until mounted
    }
    return (<select value={theme} onChange={(e) => {
            const newTheme = e.target.value;
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme); // Save to localStorage
            if (onThemeChange) {
                onThemeChange(); // Call the callback when theme changes
            }
        }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
        </select>);
}
