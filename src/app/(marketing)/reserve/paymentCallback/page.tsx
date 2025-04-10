// paymentCallback.tsx (Frontend)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

const PaymentCallbackPage = () => {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const token = new URLSearchParams(window.location.search).get('token');

            if (!token) {
                console.error('Token is missing in the callback URL');
                toast.error('Invalid payment callback');
                return;
            }

            try {
                const response = await axios.post('/api/stk-callback', { token });

                if (response.status === 200) {
                    toast.success('Payment verified successfully');
                    router.push('/dashboard');
                } else {
                    console.error('Payment failed:', response.data);
                    toast.error('Payment verification failed');
                }
            } catch (error) {
                console.error('Error processing callback:', error);
                toast.error('An error occurred while verifying your payment');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="relative flex h-screen flex-col items-center justify-center">
            <div className="h-8 w-8 animate-loading rounded-full border-[3px] border-neutral-800 border-b-neutral-200"></div>
            <p className="mt-3 text-center text-lg font-medium">Verifying your payment...</p>
        </div>
    );
};

export default PaymentCallbackPage;

// /api/stk-callback/route.ts (Backend)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const data = await request.json();

    // Handle failed transactions
    if (!data.Body?.stkCallback?.CallbackMetadata) {
        const resultDesc = data.Body.stkCallback.ResultDesc;
        console.log('Failed transaction:', resultDesc);

        // Update payment status for failed transaction
        await prisma.payment.update({
            where: { transactionId: data.Body.stkCallback.CheckoutRequestID },
            data: { status: 'failed' },
        });

        return NextResponse.json('ok saf');
    }

    // Extract values from callback metadata
    const body = data.Body.stkCallback.CallbackMetadata;
    const amountObj = body.Item.find((obj: any) => obj.Name === 'Amount');
    const amount = amountObj.Value;

    const codeObj = body.Item.find((obj: any) => obj.Name === 'MpesaReceiptNumber');
    const mpesaCode = codeObj.Value;

    const phoneNumberObj = body.Item.find((obj: any) => obj.Name === 'PhoneNumber');
    const payerPhoneNumber = phoneNumberObj.Value.toString();

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
                mpesaReceiptNumber: mpesaCode,
                payerPhoneNumber,
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
                updatedAt: new Date(),
            },
            create: {
                userId: 1, // You should get this from your auth system
                amount,
                transactionId: data.Body.stkCallback.CheckoutRequestID,
                mpesaReceiptNumber: mpesaCode,
                phoneNumber: payerPhoneNumber, // Initial phone number from request
                payerPhoneNumber,
                status: data.Body.stkCallback.ResultCode === 0 ? 'completed' : 'failed',
                transactionDate,
            },
        });

        console.log('Payment processed:', { amount, mpesaCode, payerPhoneNumber });
        return NextResponse.json('ok', { status: 200 });
    } catch (error: any) {
        console.error('Error saving payment:', error);
        return NextResponse.json('ok', { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
