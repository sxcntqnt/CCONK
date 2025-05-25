'use server';

import { db } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Report, Role } from '@/utils';
import { z } from 'zod';

// Validation Schemas
const generateReportSchema = z
    .object({
        type: z.string().min(1, 'Report type is required').max(50, 'Report type must be 50 characters or less'),
        busId: z.string().min(1, 'Bus ID must be a valid string').optional(),
        startDate: z.date().refine((date) => date <= new Date(), 'Start date must be in the past or present'),
        endDate: z.date().refine((date) => date <= new Date(), 'End date must be in the past or present'),
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: 'Start date must be before or equal to end date',
        path: ['endDate'],
    });

const createReportSchema = z.object({
    ownerId: z.string().min(1, 'Owner ID must be a valid string'),
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

// Custom Error
class ReportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReportError';
    }
}

// Define type for Prisma query result
type ReportWithOwner = Prisma.ReportGetPayload<{
    select: {
        id: true;
        ownerId: true;
        title: true;
        description: true;
        type: true;
        data: true;
        generatedAt: true;
        updatedAt: true;
        owner: { select: { id: true; userId: true; organizationId: true; createdAt: true; updatedAt: true } };
    };
}>;

// Helper function to generate report data
async function generateReportData(
    type: string,
    busId: string | undefined,
    startDate: Date,
    endDate: Date,
): Promise<Record<string, any>> {
    const trips = await db.trip.findMany({
        where: {
            ...(busId && { busId }),
            departureTime: { gte: startDate, lte: endDate },
        },
        select: {
            id: true,
            busId: true,
            status: true,
            departureTime: true,
            arrivalTime: true,
        },
    });

    return {
        type,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        trips: trips.map((trip) => ({
            id: trip.id,
            busId: trip.busId,
            status: trip.status,
            departureTime: trip.departureTime.toISOString(),
            arrivalTime: trip.arrivalTime?.toISOString(),
        })),
        totalTrips: trips.length,
    };
}

// Helper function to format Report data
function formatReport(report: ReportWithOwner): Report {
    return {
        id: report.id,
        ownerId: report.ownerId,
        title: report.title ?? undefined,
        description: report.description ?? undefined,
        type: report.type,
        data: report.data ?? undefined,
        generatedAt: report.generatedAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        owner: {
            id: report.owner.id,
            userId: report.owner.userId,
            organizationId: report.owner.organizationId ?? null,
            createdAt: report.owner.createdAt.toISOString(),
            updatedAt: report.owner.updatedAt.toISOString(),
        },
    };
}

// Generate Report (Automatic)
export async function generateReport(
    clerkId: string,
    {
        type,
        busId,
        startDate,
        endDate,
    }: {
        type: string;
        busId?: string;
        startDate: Date;
        endDate: Date;
    },
): Promise<Report> {
    try {
        const validatedData = generateReportSchema.parse({ type, busId, startDate, endDate });

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: { include: { buses: { select: { id: true } } } } },
        });
        if (!user || user.role !== Role.OWNER || !user.owner) {
            throw new ReportError('User is not authorized to generate reports');
        }

        if (validatedData.busId && !user.owner.buses.map((bus) => bus.id).includes(validatedData.busId)) {
            throw new ReportError('User does not own the specified bus');
        }

        const reportData = await generateReportData(
            validatedData.type,
            validatedData.busId,
            validatedData.startDate,
            validatedData.endDate,
        );

        const report = await db.report.create({
            data: {
                ownerId: user.owner.id,
                title: `${validatedData.type} Report (${validatedData.startDate.toISOString().split('T')[0]} to ${validatedData.endDate.toISOString().split('T')[0]})`,
                type: validatedData.type,
                description: undefined,
                data: reportData,
                generatedAt: new Date(),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                ownerId: true,
                title: true,
                description: true,
                type: true,
                data: true,
                generatedAt: true,
                updatedAt: true,
                owner: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
            },
        });

        return formatReport(report);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`generateReport error: ${errorMsg}`);
        throw new ReportError(`Failed to generate report: ${errorMsg}`);
    }
}

// Create Report (Manual)
export async function createReport({
    ownerId,
    title,
    type,
    description,
    data,
    clerkId,
}: {
    ownerId: string;
    title: string;
    type: string;
    description?: string;
    data?: Record<string, any>;
    clerkId: string;
}): Promise<Report> {
    try {
        const validatedData = createReportSchema.parse({ ownerId, title, type, description, data });

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || user.role !== Role.OWNER || !user.owner || user.owner.id !== validatedData.ownerId) {
            throw new ReportError('User is not authorized to create reports for this owner');
        }

        const report = await db.report.create({
            data: {
                ownerId: validatedData.ownerId,
                title: validatedData.title,
                type: validatedData.type,
                description: validatedData.description,
                data: validatedData.data,
                generatedAt: new Date(),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                ownerId: true,
                title: true,
                description: true,
                type: true,
                data: true,
                generatedAt: true,
                updatedAt: true,
                owner: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
            },
        });

        return formatReport(report);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`createReport error: ${errorMsg}`);
        throw new ReportError(`Failed to create report: ${errorMsg}`);
    }
}

// Update Report
export async function updateReport(
    clerkId: string,
    reportId: string,
    {
        title,
        description,
        data,
    }: {
        title?: string;
        description?: string | null;
        data?: Record<string, any>;
    },
): Promise<Report> {
    try {
        const validatedData = updateReportSchema.parse({ title, description, data });
        if (!reportId) {
            throw new ReportError('Invalid report ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || user.role !== Role.OWNER || !user.owner) {
            throw new ReportError('User is not authorized to update reports');
        }

        const report = await db.report.findUnique({
            where: { id: reportId },
            select: { id: true, ownerId: true, owner: { select: { id: true } } },
        });
        if (!report) {
            throw new ReportError('Report not found');
        }
        if (report.ownerId !== user.owner.id) {
            throw new ReportError('User does not own this report');
        }

        const updatedReport = await db.report.update({
            where: { id: reportId },
            data: {
                title: validatedData.title ?? undefined,
                description: validatedData.description ?? undefined,
                data: validatedData.data ?? undefined,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                ownerId: true,
                title: true,
                description: true,
                type: true,
                data: true,
                generatedAt: true,
                updatedAt: true,
                owner: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
            },
        });

        return formatReport(updatedReport);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`updateReport error: ${errorMsg}`);
        throw new ReportError(`Failed to update report: ${errorMsg}`);
    }
}

// Read Reports
export async function getReports({
    ownerId,
    page = 1,
    pageSize = 10,
    filters = {},
    clerkId,
}: {
    ownerId: string;
    page?: number;
    pageSize?: number;
    filters?: { type?: string };
    clerkId: string;
}): Promise<{ reports: Report[]; total: number }> {
    try {
        const pagination = paginationSchema.parse({ page, pageSize });
        const validatedFilters = filterSchema.parse(filters);

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || user.role !== Role.OWNER || !user.owner || user.owner.id !== ownerId) {
            throw new ReportError('User is not authorized to fetch reports');
        }

        const where = {
            ownerId,
            ...(validatedFilters.type && { type: validatedFilters.type }),
        };

        const [reports, total] = await Promise.all([
            db.report.findMany({
                where,
                select: {
                    id: true,
                    ownerId: true,
                    title: true,
                    description: true,
                    type: true,
                    data: true,
                    generatedAt: true,
                    updatedAt: true,
                    owner: {
                        select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true },
                    },
                },
                skip: (pagination.page - 1) * pagination.pageSize,
                take: pagination.pageSize,
                orderBy: { generatedAt: 'desc' },
            }),
            db.report.count({ where }),
        ]);

        const formattedReports: Report[] = reports.map(formatReport);

        return { reports: formattedReports, total };
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getReports error: ${errorMsg}`);
        throw new ReportError(`Failed to fetch reports: ${errorMsg}`);
    }
}

// Read Report by ID
export async function getReportById({
    ownerId,
    id,
    clerkId,
}: {
    ownerId: string;
    id: string;
    clerkId: string;
}): Promise<Report> {
    try {
        if (!id) {
            throw new ReportError('Invalid report ID');
        }

        const user = await db.user.findUnique({
            where: { clerkId },
            include: { owner: true },
        });
        if (!user || user.role !== Role.OWNER || !user.owner || user.owner.id !== ownerId) {
            throw new ReportError('User is not authorized to fetch report');
        }

        const report = await db.report.findFirst({
            where: {
                id,
                ownerId,
            },
            select: {
                id: true,
                ownerId: true,
                title: true,
                description: true,
                type: true,
                data: true,
                generatedAt: true,
                updatedAt: true,
                owner: { select: { id: true, userId: true, organizationId: true, createdAt: true, updatedAt: true } },
            },
        });

        if (!report) {
            throw new ReportError('Report not found');
        }

        return formatReport(report);
    } catch (error) {
        const errorMsg =
            error instanceof z.ZodError
                ? error.errors.map((e) => e.message).join(', ')
                : error instanceof Error
                  ? error.message
                  : String(error);
        console.error(`getReportById error: ${errorMsg}`);
        throw new ReportError(`Failed to fetch report: ${errorMsg}`);
    }
}
