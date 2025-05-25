'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIncomeExpenseStore } from '@/store';
import { IncomeExpense } from '@/utils/constants/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getFuelRecords, addFuelRecord } from '@/lib/prisma/dbVehicle';

const FuelPage = () => {
    const { incomeExpenses, setIncomeExpenses } = useIncomeExpenseStore();
    const [newFuel, setNewFuel] = useState({
        fuel_quantity: '',
        odometerreading: '',
        fuelprice: '',
        fuelfilldate: '',
        fueladdedby: '',
        busId: '',
    });
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch fuel records
    useEffect(() => {
        const fetchFuelRecords = async () => {
            try {
                // TODO: Replace with actual ownerId from Clerk authentication
                const ownerId = 1;
                const { fuelRecords } = await getFuelRecords({ ownerId, page: 1, pageSize: 100 });
                const mappedFuelRecords: IncomeExpense[] = fuelRecords.map((record) => ({
                    id: record.id,
                    ownerId,
                    type: 'expense',
                    category: 'fuel',
                    amount: record.fuel_quantity * record.fuelprice,
                    description: record.fuelcomments,
                    recordedAt: record.fuelfilldate,
                    updatedAt: record.created_date,
                    busId: record.busId,
                }));
                setIncomeExpenses(mappedFuelRecords);
                setError(null);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to fetch fuel records';
                setError(errorMsg);
                console.error(errorMsg);
            }
        };
        fetchFuelRecords();
    }, [setIncomeExpenses]);

    // Scroll-based animation trigger
    useEffect(() => {
        const handleScroll = () => {
            if (!scrollContainerRef.current) return;
            const cards = scrollContainerRef.current.querySelectorAll('.fuel-card');
            cards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                (card as HTMLElement).style.opacity = isVisible ? '1' : '0.7';
            });
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Add new fuel expense
    const handleAddFuel = async () => {
        if (
            !newFuel.fuel_quantity ||
            !newFuel.odometerreading ||
            !newFuel.fuelprice ||
            !newFuel.fuelfilldate ||
            !newFuel.fueladdedby ||
            !newFuel.busId
        ) {
            setError('All fields are required');
            return;
        }

        try {
            // TODO: Replace with actual ownerId from Clerk authentication
            const ownerId = 1;
            const fuelRecord = await addFuelRecord({
                ownerId,
                busId: parseInt(newFuel.busId),
                fuel_quantity: parseFloat(newFuel.fuel_quantity),
                odometerreading: parseInt(newFuel.odometerreading),
                fuelprice: parseFloat(newFuel.fuelprice),
                fuelfilldate: newFuel.fuelfilldate,
                fueladdedby: newFuel.fueladdedby,
            });

            const newEntry: IncomeExpense = {
                id: fuelRecord.id,
                ownerId,
                type: 'expense',
                category: 'fuel',
                amount: fuelRecord.fuel_quantity * fuelRecord.fuelprice,
                description: fuelRecord.fuelcomments,
                recordedAt: fuelRecord.fuelfilldate,
                updatedAt: fuelRecord.created_date,
                busId: fuelRecord.busId,
            };

            setIncomeExpenses([...incomeExpenses, newEntry]);
            setNewFuel({
                fuel_quantity: '',
                odometerreading: '',
                fuelprice: '',
                fuelfilldate: '',
                fueladdedby: '',
                busId: '',
            });
            setError(null);
            inputRef.current?.focus();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to add fuel record';
            setError(errorMsg);
            console.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto"
            >
                <h1 className="text-3xl font-bold mb-6 text-center">Fuel Expenses</h1>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-3 bg-red-500 text-white rounded-xl"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Input Form */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mb-6 p-4 bg-gray-700 rounded-2xl shadow-lg"
                >
                    <Input
                        ref={inputRef}
                        type="number"
                        placeholder="Fuel Quantity (liters)"
                        value={newFuel.fuel_quantity}
                        onChange={(e) => setNewFuel({ ...newFuel, fuel_quantity: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Input
                        type="number"
                        placeholder="Odometer Reading (km)"
                        value={newFuel.odometerreading}
                        onChange={(e) => setNewFuel({ ...newFuel, odometerreading: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Input
                        type="number"
                        placeholder="Fuel Price (KES/liter)"
                        value={newFuel.fuelprice}
                        onChange={(e) => setNewFuel({ ...newFuel, fuelprice: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Input
                        type="date"
                        placeholder="Fill Date"
                        value={newFuel.fuelfilldate}
                        onChange={(e) => setNewFuel({ ...newFuel, fuelfilldate: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Input
                        type="text"
                        placeholder="Added By"
                        value={newFuel.fueladdedby}
                        onChange={(e) => setNewFuel({ ...newFuel, fueladdedby: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Input
                        type="number"
                        placeholder="Bus ID"
                        value={newFuel.busId}
                        onChange={(e) => setNewFuel({ ...newFuel, busId: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Button
                        onClick={handleAddFuel}
                        className="w-full bg-green-500 hover:bg-green-600 rounded-xl"
                        asChild
                    >
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            Add Fuel Expense
                        </motion.button>
                    </Button>
                </motion.div>

                {/* Fuel Expenses List */}
                <div ref={scrollContainerRef} className="space-y-4">
                    <AnimatePresence>
                        {incomeExpenses
                            .filter((expense) => expense.category === 'fuel')
                            .map((expense) => (
                                <motion.div
                                    key={expense.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="fuel-card"
                                >
                                    <Card className="bg-gray-700 border-gray-600 rounded-2xl shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Bus #{expense.busId}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p>
                                                <strong>Amount:</strong> KES {expense.amount}
                                            </p>
                                            <p>
                                                <strong>Date:</strong> {expense.recordedAt.split('T')[0]}
                                            </p>
                                            {expense.description && (
                                                <p>
                                                    <strong>Comments:</strong> {expense.description}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Floating Action Button */}
            <motion.div className="fixed bottom-6 right-6" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                    onClick={() => inputRef.current?.focus()}
                    className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 shadow-lg"
                >
                    +
                </Button>
            </motion.div>
        </div>
    );
};

export default FuelPage;
