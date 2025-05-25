'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useReminderStore } from '@/store';
import { Reminder, Bus } from '@/utils/constants/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';
import { getReminders } from '@/lib/prisma/dbReminder';
import { getBuses } from '@/lib/prisma/dbOwner';
import { saveReminder } from '@/actions/reminders';
// Type for form state
interface NewReminderState {
    title: string;
    message: string;
    date: string; // ISO string for datetime-local input
    busId: string;
    maintenanceType: string;
    isMaintenance: boolean;
}

// Type for form fields (only string fields)
interface FormField {
    id: 'title' | 'message' | 'maintenanceType';
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
}

const RemindersPage = () => {
    const router = useRouter();
    const { userId } = useAuth();
    const { reminders, setReminders } = useReminderStore();
    const [buses, setBuses] = useState<Bus[]>([]);
    const [newReminder, setNewReminder] = useState<NewReminderState>({
        title: '',
        message: '',
        date: '',
        busId: '',
        maintenanceType: '',
        isMaintenance: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'default' | 'destructive' | 'success';
    } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch reminders and buses
    useEffect(() => {
        const fetchData = async () => {
            try {
                const ownerId = userId;
                const [{ reminders }, { buses }] = await Promise.all([
                    getReminders({ ownerId, page: 1, pageSize: 100 }),
                    getBuses({ ownerId, page: 1, pageSize: 100 }),
                ]);
                setReminders(reminders);
                setBuses(buses);
                setError(null);
            } catch (err) {
                setError('Failed to fetch reminders or buses');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [setReminders]);

    // Show toast
    const showToast = (title: string, description: string, variant: 'default' | 'destructive' | 'success') => {
        setToast({ open: true, title, description, variant });
    };

    // Add new reminder
    const handleAddReminder = async () => {
        if (!newReminder.title || !newReminder.message || !newReminder.busId) {
            showToast('Error', 'Title, message, and bus are required', 'destructive');
            return;
        }
        const busIdNum = parseInt(newReminder.busId);
        if (isNaN(busIdNum) || !buses.some((bus) => bus.id === busIdNum)) {
            showToast('Error', 'Invalid bus ID', 'destructive');
            return;
        }
        if (!newReminder.date) {
            showToast('Error', 'Date is required', 'destructive');
            return;
        }

        try {
            const savedReminder = await saveReminder({
                title: newReminder.title,
                message: newReminder.message,
                busId: busIdNum,
                date: new Date(newReminder.date),
                maintenanceType: newReminder.maintenanceType || undefined,
                isMaintenance: newReminder.isMaintenance,
            });

            setReminders([...reminders, savedReminder]);
            setNewReminder({
                title: '',
                message: '',
                date: '',
                busId: '',
                maintenanceType: '',
                isMaintenance: false,
            });
            showToast('Success', 'Reminder added successfully', 'success');
            inputRef.current?.focus();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            showToast('Error', errorMsg, 'destructive');
        }
    };

    // Handle edit navigation
    const handleEditReminder = (id: number) => {
        router.push(`/dashboard/reminder/${id}`);
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.8, 0.25, 1] },
        }),
    };

    const formVariants = {
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

    // Define form fields with explicit typing
    const formFields: FormField[] = [
        { id: 'title', label: 'Title', type: 'text', required: true },
        { id: 'message', label: 'Message', type: 'text', required: true },
        {
            id: 'maintenanceType',
            label: 'Maintenance Type (Optional)',
            type: 'text',
            placeholder: 'e.g., Oil Change, Tire Rotation',
        },
    ];

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
                    className="text-3xl font-bold mb-6 text-center"
                >
                    Reminders
                </motion.h1>

                <AnimatePresence>
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="text-gray-400 animate-pulse text-center"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            Loading reminders...
                        </motion.div>
                    ) : error ? (
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
                                    <p>{error}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : reminders.length === 0 ? (
                        <motion.div
                            key="empty"
                            className="text-gray-400 text-center"
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            No reminders available.
                        </motion.div>
                    ) : (
                        <>
                            {/* Input Form */}
                            <motion.div
                                className="mb-6 p-4 bg-gray-700 rounded-2xl shadow-lg max-w-2xl mx-auto"
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {formFields.map((field, index) => (
                                    <motion.div
                                        key={field.id}
                                        custom={index}
                                        variants={fieldVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <Label htmlFor={field.id}>{field.label}</Label>
                                        <Input
                                            id={field.id}
                                            name={field.id}
                                            type={field.type}
                                            value={newReminder[field.id]}
                                            onChange={(e) =>
                                                setNewReminder({ ...newReminder, [e.target.name]: e.target.value })
                                            }
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                                        />
                                    </motion.div>
                                ))}
                                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                                    <Label htmlFor="busId">Bus</Label>
                                    <Select
                                        value={newReminder.busId}
                                        onValueChange={(value) => setNewReminder({ ...newReminder, busId: value })}
                                    >
                                        <SelectTrigger className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl">
                                            <SelectValue placeholder="Select a bus" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 text-white border-gray-600">
                                            {buses.map((bus) => (
                                                <SelectItem key={bus.id} value={bus.id.toString()}>
                                                    {bus.licensePlate}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </motion.div>
                                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        name="date"
                                        type="datetime-local"
                                        value={newReminder.date}
                                        onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                        required
                                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                                    />
                                </motion.div>
                                <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
                                    <Label className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={newReminder.isMaintenance}
                                            onCheckedChange={(checked) =>
                                                setNewReminder({ ...newReminder, isMaintenance: !!checked })
                                            }
                                            className="border-gray-600"
                                        />
                                        <span>Mark as Maintenance Schedule</span>
                                    </Label>
                                </motion.div>
                                <motion.div
                                    custom={6}
                                    variants={fieldVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileTap={{ scale: 0.95 }}
                                    className="motion-safe:transition-transform motion-safe:duration-200"
                                >
                                    <Button
                                        onClick={handleAddReminder}
                                        className="w-full bg-green-500 hover:bg-green-600 rounded-xl"
                                    >
                                        Add Reminder
                                    </Button>
                                </motion.div>
                            </motion.div>

                            {/* Reminders List */}
                            <div className="space-y-4 max-w-2xl mx-auto">
                                {reminders.map((reminder, index) => (
                                    <motion.div
                                        key={reminder.id}
                                        custom={index}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="cursor-pointer"
                                        onClick={() => handleEditReminder(reminder.id)}
                                    >
                                        <Card className="bg-gray-700 border-gray-600 rounded-2xl shadow-lg">
                                            <CardHeader>
                                                <CardTitle className="text-lg">
                                                    {reminder.title || 'Reminder'}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p>{reminder.message}</p>
                                                <p className="text-sm text-gray-400">
                                                    Due: {new Date(reminder.date).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Created: {new Date(reminder.created_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Bus: {reminder.bus.licensePlate}
                                                </p>
                                                {reminder.maintenanceType && (
                                                    <p className="text-sm text-gray-400">
                                                        Type: {reminder.maintenanceType}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-400">
                                                    Maintenance: {reminder.isMaintenance ? 'Yes' : 'No'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Read: {reminder.isread ? 'Yes' : 'No'}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {/* Floating Action Button */}
                <motion.div
                    className="fixed bottom-6 right-6"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } }}
                >
                    <Button
                        onClick={() => inputRef.current?.focus()}
                        className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center"
                    >
                        +
                    </Button>
                </motion.div>
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

export default RemindersPage;
