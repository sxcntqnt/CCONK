// /api/stk-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const data = await request.json();

    // Handle failed transactions
    if (!data.Body?.stkCallback?.CallbackMetadata) {
        const resultDesc = data.Body.stkCallback.ResultDesc;
        console.log('Failed transaction:', resultDesc);

        try {
            await prisma.payment.update({
                where: { transactionId: data.Body.stkCallback.CheckoutRequestID },
                data: { status: 'failed' },
            });
        } catch (error) {
            console.error('Error updating failed payment:', error);
        }

        return NextResponse.json('ok', { status: 200 });
    }

    // Extract values from callback metadata
    const body = data.Body.stkCallback.CallbackMetadata;
    const amountObj = body.Item.find((obj: any) => obj.Name === 'Amount');
    const amount = amountObj?.Value;

    const codeObj = body.Item.find((obj: any) => obj.Name === 'MpesaReceiptNumber');
    const mpesaReceiptNumber = codeObj?.Value;

    const phoneNumberObj = body.Item.find((obj: any) => obj.Name === 'PhoneNumber');
    const payerPhoneNumber = phoneNumberObj?.Value?.toString();

    const transactionDateObj = body.Item.find((obj: any) => obj.Name === 'TransactionDate');
    const transactionDate = transactionDateObj ? new Date(transactionDateObj.Value) : new Date();

    try {
        // Save or update payment in database
        const payment = await prisma.payment.upsert({
            where: {
                transactionId: data.Body.stkCallback.CheckoutRequestID,
            },
            update: {
                amount,
                mpesaReceiptNumber,
                payerPhoneNumber,
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
                updatedAt: new Date(),
            },
            create: {
                userId: 1, // Replace with actual user ID from auth system
                amount,
                transactionId: data.Body.stkCallback.CheckoutRequestID,
                mpesaReceiptNumber,
                phoneNumber: payerPhoneNumber || 'unknown', // Fallback if not provided initially
                payerPhoneNumber,
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
            },
        });

        console.log('Payment processed:', { amount, mpesaReceiptNumber, payerPhoneNumber });
        return NextResponse.json('ok', { status: 200 });
    } catch (error: any) {
        console.error('Error saving payment:', error);
        return NextResponse.json('ok', { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
