'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LogoutPage = () => {
    const { signOut } = useClerk();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to log out. Please try again.');
        }
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto max-w-md"
            >
                <Card className="bg-gray-700 border-gray-600 rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Log Out</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="mb-6 text-gray-300">Are you sure you want to log out?</p>
                        <div className="flex flex-col space-y-4">
                            <Button
                                variant="destructive"
                                size="lg"
                                onClick={handleLogout}
                                className="w-full rounded-xl"
                                asChild
                            >
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    Log Out
                                </motion.button>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleCancel}
                                className="w-full bg-gray-800 text-white border-gray-600 rounded-xl"
                                asChild
                            >
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    Cancel
                                </motion.button>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default LogoutPage;
