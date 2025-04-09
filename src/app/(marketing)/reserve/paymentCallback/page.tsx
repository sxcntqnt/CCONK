// app/api/stk-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // adjust if your path differs

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const callback = data.Body?.stkCallback;

        if (!callback) {
            console.error('Missing stkCallback in payload');
            return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 });
        }

        const checkoutRequestId = callback.CheckoutRequestID;
        const resultCode = callback.ResultCode;
        const resultDesc = callback.ResultDesc;

        // Handle failed transaction (no metadata returned)
        if (!callback.CallbackMetadata) {
            await prisma.payment.updateMany({
                where: { transactionId: checkoutRequestId },
                data: {
                    status: 'failed',
                    updatedAt: new Date(),
                },
            });

            console.warn('STK Callback failed:', resultDesc);
            return NextResponse.json({ status: 'failed', description: resultDesc });
        }

        // ✅ Parse metadata
        const metadata = Object.fromEntries(callback.CallbackMetadata.Item.map((item: any) => [item.Name, item.Value]));

        const amount = parseFloat(metadata.Amount);
        const mpesaReceiptNumber = metadata.MpesaReceiptNumber;
        const payerPhoneNumber = metadata.PhoneNumber?.toString();
        const transactionDate = new Date(metadata.TransactionDate?.toString().replace(' ', 'T') || new Date());

        // ✅ Update payment record
        const updated = await prisma.payment.updateMany({
            where: {
                transactionId: checkoutRequestId,
            },
            data: {
                amount,
                mpesaReceiptNumber,
                payerPhoneNumber,
                transactionDate,
                status: resultCode === 0 ? 'success' : 'failed',
                updatedAt: new Date(),
            },
        });

        if (updated.count === 0) {
            console.warn('No payment record found for CheckoutRequestID:', checkoutRequestId);
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'ok', message: 'Payment updated successfully' });
    } catch (error: any) {
        console.error('Error processing STK Callback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
