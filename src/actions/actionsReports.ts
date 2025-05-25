'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateReport, createReport, updateReport, getReports, getReportById } from '@/lib/dbReports';
import { Report } from '@/lib/prisma/dbtypes';

// Validation Schemas
const generateReportSchema = z
    .object({
        type: z.string().min(1, 'Report type is required').max(50, 'Report type must be 50 characters or less'),
        busId: z.number().positive('Bus ID must be a positive number').optional(),
        startDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid start date' }),
        endDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid end date' }),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
        message: 'Start date must be before or equal to end date',
        path: ['endDate'],
    });

const createReportSchema = z.object({
    ownerId: z.number().positive('Owner ID must be a positive number'),
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    type: z.string().min(1, 'Report type is required').max(50, 'Report type must be 50 characters or less'),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    data: z.record(z.any()).optional(),
});

const updateReportSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    data: z.record(z.any()).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1, 'Page must be at least 1').default(1),
    pageSize: z.number().min(1).max(100, 'Page size must be between 1 and 100').default(10),
});

const filterSchema = z.object({
    type: z.string().max(50, 'Report type must be 50 characters or less').optional(),
});

// Helper to get authenticated clerkId
async function getClerkId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return session.user.id;
}

// Generate a report
export async function generateReportAction(formData: FormData): Promise<Report> {
    try {
        const clerkId = await getClerkId();
        const data = {
            type: formData.get('type') as string,
            busId: formData.get('busId') ? Number(formData.get('busId')) : undefined,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
        };

        const validatedData = generateReportSchema.parse(data);
        const report = await generateReport(clerkId, {
            ...validatedData,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
        });

        revalidatePath('/reports');
        return report;
    } catch (error) {
        console.error('generateReportAction error:', error);
        throw new Error('Failed to generate report');
    }
}

// Create a report
export async function createReportAction(formData: FormData): Promise<Report> {
    try {
        const data = {
            ownerId: Number(formData.get('ownerId')),
            title: formData.get('title') as string,
            type: formData.get('type') as string,
            description: formData.get('description') as string | undefined,
            data: formData.get('data') ? JSON.parse(formData.get('data') as string) : undefined,
        };

        const validatedData = createReportSchema.parse(data);
        const report = await createReport(validatedData);

        revalidatePath('/reports');
        return report;
    } catch (error) {
        console.error('createReportAction error:', error);
        throw new Error('Failed to create report');
    }
}

// Update a report
export async function updateReportAction(reportId: number, formData: FormData): Promise<Report> {
    try {
        const clerkId = await getClerkId();
        const data = {
            title: formData.get('title') as string | undefined,
            description: formData.get('description') as string | undefined,
            data: formData.get('data') ? JSON.parse(formData.get('data') as string) : undefined,
        };

        const validatedData = updateReportSchema.parse(data);
        const report = await updateReport(clerkId, reportId, validatedData);

        revalidatePath(`/reports/${reportId}`);
        return report;
    } catch (error) {
        console.error('updateReportAction error:', error);
        throw new Error('Failed to update report');
    }
}

// Get reports with pagination and filters
export async function getReportsAction({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
}: {
    ownerId: number;
    page?: number;
    pageSize?: number;
    filters?: { type?: string };
}): Promise<{ reports: Report[]; total: number }> {
    try {
        const validatedPagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        return await getReports({
            ownerId,
            page: validatedPagination.page,
            pageSize: validatedPagination.pageSize,
            filters: validatedFilters,
        });
    } catch (error) {
        console.error('getReportsAction error:', error);
        throw new Error('Failed to fetch reports');
    }
}

// Get a report by ID
export async function getReportByIdAction({ ownerId, id }: { ownerId: number; id: number }): Promise<Report> {
    try {
        return await getReportById({ ownerId, id });
    } catch (error) {
        console.error('getReportByIdAction error:', error);
        throw new Error('Failed to fetch report');
    }
}
