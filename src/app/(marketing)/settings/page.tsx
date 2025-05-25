'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const SettingsPage = () => {
    const { notifications, theme, setNotifications, setTheme } = useSettingsStore();
    const inputRef = useRef<HTMLButtonElement>(null);

    const handleSaveSettings = () => {
        // In a real app, save to backend or local storage
        alert('Settings saved successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto max-w-md"
            >
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    Settings
                </h1>

                {/* Notifications Section */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mb-6 p-4 bg-gray-800/80 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-gray-700"
                >
                    <h2 className="text-xl font-semibold mb-4 text-blue-200">Notifications</h2>
                    <div className="flex items-center justify-between mb-4">
                        <Label htmlFor="email-notifications" className="text-sm text-gray-300">
                            Email Notifications
                        </Label>
                        <Switch
                            id="email-notifications"
                            checked={notifications.email}
                            onCheckedChange={(checked: boolean) => setNotifications({ email: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifications" className="text-sm text-gray-300">
                            Push Notifications
                        </Label>
                        <Switch
                            id="push-notifications"
                            checked={notifications.push}
                            onCheckedChange={(checked: boolean) => setNotifications({ push: checked })}
                        />
                    </div>
                </motion.div>

                {/* Theme Section */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="mb-6 p-4 bg-gray-800/80 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-gray-700"
                >
                    <h2 className="text-xl font-semibold mb-4 text-blue-200">Theme</h2>
                    <Select value={theme} onValueChange={(value: 'light' | 'dark') => setTheme(value)}>
                        <SelectTrigger className="w-full bg-gray-900 text-white border-gray-600 rounded-xl hover:bg-gray-700 transition-colors">
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 text-white border-gray-600 rounded-xl">
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                    </Select>
                </motion.div>

                {/* Save Button */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                >
                    <Button
                        variant="default"
                        size="lg"
                        onClick={handleSaveSettings}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-xl shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        asChild
                    >
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            Save Settings
                        </motion.button>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Floating Action Button */}
            <motion.div className="fixed bottom-6 right-6" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                    ref={inputRef}
                    onClick={handleSaveSettings}
                    className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                    ✓
                </Button>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
