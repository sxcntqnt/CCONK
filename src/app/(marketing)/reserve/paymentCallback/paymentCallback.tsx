// paymentCallback.tsx
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
                return;
            }

            try {
                const response = await axios.post('/api/stk-callback', { token });

                if (response.data.ResponseCode === '0') {
                    router.push('/dashboard');
                } else {
                    console.error('Payment failed:', response.data.ResponseDescription);
                    toast.error(`Payment failed: ${response.data.ResponseDescription}`);
                }
            } catch (error) {
                console.error('Error processing callback:', error);
                toast.error('An error occurred while processing the payment callback.');
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
