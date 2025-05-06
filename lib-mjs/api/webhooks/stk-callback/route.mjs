// /api/stk-callback/route.ts
import { NextResponse } from 'next/server';
import { db as prisma } from '../../../../src/lib/prisma/index.ts.mjs';
export async function POST(request) {
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
        }
        catch (error) {
            console.error('Error updating failed payment:', error);
        }
        return NextResponse.json('ok', { status: 200 });
    }
    // Extract values from callback metadata
    const body = data.Body.stkCallback.CallbackMetadata;
    const amountObj = body.Item.find((obj) => obj.Name === 'Amount');
    const amount = amountObj?.Value;
    const phoneNumberObj = body.Item.find((obj) => obj.Name === 'PhoneNumber');
    const phoneNumber = phoneNumberObj?.Value?.toString();
    const transactionDateObj = body.Item.find((obj) => obj.Name === 'TransactionDate');
    const transactionDate = transactionDateObj ? new Date(transactionDateObj.Value) : new Date();
    try {
        // Save or update payment in database
        const payment = await prisma.payment.upsert({
            where: {
                transactionId: data.Body.stkCallback.CheckoutRequestID,
            },
            update: {
                amount,
                phoneNumber,
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
                updatedAt: new Date(),
            },
            create: {
                userId: 1, // Replace with actual user ID from auth system
                amount,
                transactionId: data.Body.stkCallback.CheckoutRequestID,
                phoneNumber: phoneNumber || 'unknown', // Fallback if not provided
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
            },
        });
        console.log('Payment processed:', { amount, phoneNumber, transactionDate });
        return NextResponse.json('ok', { status: 200 });
    }
    catch (error) {
        console.error('Error saving payment:', error);
        return NextResponse.json({ error: 'Error saving payment' }, { status: 500 });
    }
    finally {
        await prisma.$disconnect();
    }
}
