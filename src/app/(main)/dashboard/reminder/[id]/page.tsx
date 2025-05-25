'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { Reminder } from '@/utils/constants/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';
import { getReminderById } from '@/lib/prisma/dbReminder';

const ReminderDetailsPage = () => {
    const router = useRouter();
    const params = useParams();
    const { userId } = useAuth(); // Get Clerk userId
    const reminderId = parseInt(params.id as string, 10);
    const [reminder, setReminder] = useState<Reminder | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'default' | 'destructive' | 'success';
    } | null>(null);

    // Show toast
    const showToast = (title: string, description: string, variant: 'default' | 'destructive' | 'success') => {
        setToast({ open: true, title, description, variant });
    };

    // Fetch reminder data
    const fetchData = async () => {
        if (isNaN(reminderId)) {
            setError('Invalid reminder ID');
            showToast('Error', 'Invalid reminder ID', 'destructive');
            setIsLoading(false);
            return;
        }

        if (!userId) {
            setError('You must be logged in to view reminders');
            showToast('Error', 'Authentication required', 'destructive');
            setIsLoading(false);
            router.push('/sign-in'); // Redirect to sign-in page
            return;
        }

        try {
            const ownerId = userId; // Map Clerk userId to ownerId
            const fetchedReminder = await getReminderById({ ownerId, id: reminderId });
            setReminder(fetchedReminder);
            setError(null);
            showToast('Success', 'Reminder loaded successfully', 'success');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch reminder data';
            setError(errorMsg);
            showToast('Error', errorMsg, 'destructive');
            console.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [reminderId]);

    // Navigation handlers
    const handleEdit = () => {
        router.push(`/dashboard/reminder/${reminderId}/edit`); // Adjust if edit is not a separate route
    };

    const handleBack = () => {
        router.push('/dashboard/reminder');
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.8, 0.25, 1] } },
    };

    const fieldVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.1, duration: 0.3, ease: [0.25, 0.8, 0.25, 1] },
        }),
    };

    const messageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
                <AnimatePresence>
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            className="text-gray-400 animate-pulse text-center"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            Loading reminder details...
                        </motion.div>
                    ) : error || !reminder ? (
                        <motion.div
                            key="error"
                            className="max-w-2xl mx-auto"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <Card className="bg-red-500 text-white shadow-lg rounded-xl">
                                <CardContent className="pt-6">
                                    <p>{error || 'Reminder not found'}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reminder"
                            className="max-w-2xl w-full mx-auto"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Card className="bg-gray-700 text-white shadow-lg rounded-xl">
                                <CardHeader>
                                    <CardTitle>{reminder.title || 'Reminder'}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'Message', value: reminder.message },
                                        {
                                            label: 'Due Date',
                                            value: new Date(reminder.date).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                        },
                                        { label: 'Bus', value: reminder.bus.licensePlate },
                                        { label: 'Maintenance Type', value: reminder.maintenanceType || 'N/A' },
                                        { label: 'Maintenance Schedule', value: reminder.isMaintenance ? 'Yes' : 'No' },
                                        { label: 'Read', value: reminder.isread ? 'Yes' : 'No' },
                                        {
                                            label: 'Created',
                                            value: new Date(reminder.created_date).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                        },
                                    ].map((field, index) => (
                                        <motion.div
                                            key={field.label}
                                            custom={index}
                                            variants={fieldVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <p>
                                                <strong>{field.label}:</strong> {field.value}
                                            </p>
                                        </motion.div>
                                    ))}
                                </CardContent>
                                <div className="p-4 flex space-x-4">
                                    <motion.div
                                        whileTap={{ scale: 0.95 }}
                                        className="motion-safe:transition-transform motion-safe:duration-200"
                                    >
                                        <Button
                                            onClick={handleEdit}
                                            className="bg-green-500 hover:bg-green-600 rounded-xl"
                                        >
                                            Edit Reminder
                                        </Button>
                                    </motion.div>
                                    <motion.div
                                        whileTap={{ scale: 0.95 }}
                                        className="motion-safe:transition-transform motion-safe:duration-200"
                                    >
                                        <Button
                                            onClick={handleBack}
                                            className="bg-gray-500 hover:bg-gray-600 rounded-xl"
                                        >
                                            Back to Reminders
                                        </Button>
                                    </motion.div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toast Rendering */}
            <ToastViewport />
            {toast && (
                <Toast open={toast.open} onOpenChange={(open) => setToast({ ...toast, open })} variant={toast.variant}>
                    <ToastTitle>{toast.title}</ToastTitle>
                    <ToastDescription>{toast.description}</ToastDescription>
                    <ToastClose />
                </Toast>
            )}
        </ToastProvider>
    );
};

export default ReminderDetailsPage;
