'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReportStore } from '@/store';
import { Report } from '@/utils/constants/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getReports, addReport } from '@/lib/prisma/dbReports';

const ReportsPage = () => {
    const { reports, setReports } = useReportStore();
    const [newReport, setNewReport] = useState({ title: '', type: 'fuel', period: 'monthly' });
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch reports
    useEffect(() => {
        const fetchReports = async () => {
            try {
                // TODO: Replace with actual ownerId from Clerk authentication
                const ownerId = 1;
                const { reports: fetchedReports } = await getReports({ ownerId, page: 1, pageSize: 100 });
                setReports(fetchedReports);
                setError(null);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to fetch reports';
                setError(errorMsg);
                console.error(errorMsg);
            }
        };
        fetchReports();
    }, [setReports]);

    // Add new report
    const handleGenerateReport = async () => {
        if (!newReport.title || !newReport.type || !newReport.period) {
            setError('Title, type, and period are required');
            return;
        }

        try {
            // TODO: Replace with actual ownerId from Clerk authentication
            const ownerId = 1;
            const report = await addReport({
                ownerId,
                title: newReport.title,
                type: newReport.type,
                description: `Generated ${newReport.type} report for ${newReport.period} period`,
            });

            setReports([...reports, report]);
            setNewReport({ title: '', type: 'fuel', period: 'monthly' });
            setError(null);
            inputRef.current?.focus();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to add report';
            setError(errorMsg);
            console.error(errorMsg);
        }
    };

    // Filter reports
    const filteredReports = filter === 'all' ? reports : reports.filter((report) => report.type === filter);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto"
            >
                <h1 className="text-3xl font-bold mb-6 text-center">Reports</h1>

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

                {/* Filter and Input Form */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mb-6 p-4 bg-gray-700 rounded-2xl shadow-lg"
                >
                    <Select onValueChange={setFilter} defaultValue="all">
                        <SelectTrigger className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Report Title"
                        value={newReport.title}
                        onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                        className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl"
                    />
                    <Select onValueChange={(value) => setNewReport({ ...newReport, type: value })} defaultValue="fuel">
                        <SelectTrigger className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectValue placeholder="Report Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(value) => setNewReport({ ...newReport, period: value })}
                        defaultValue="monthly"
                    >
                        <SelectTrigger className="mb-2 bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 text-white border-gray-600 rounded-xl">
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleGenerateReport}
                        className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl"
                        asChild
                    >
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            Generate Report
                        </motion.button>
                    </Button>
                </motion.div>

                {/* Reports List */}
                <div ref={scrollContainerRef} className="space-y-4">
                    <AnimatePresence>
                        {filteredReports.map((report) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="report-card"
                                whileHover={{ scale: 1.02 }}
                            >
                                <Card className="bg-gray-700 border-gray-600 rounded-2xl shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {report.title} ({report.description?.split(' ')[2] || 'Custom'})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p>{report.description || 'No content available'}</p>
                                        <p className="text-sm text-gray-400">
                                            Generated: {report.generatedAt.split('T')[0]}
                                        </p>
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

export default ReportsPage;
