import { Metadata } from 'next';

export const generateMetadata = ({
    title = `${process.env.NEXT_PUBLIC_APP_NAME} - Advanced logistics solutions `,
    description = `${process.env.NEXT_PUBLIC_APP_NAME} SxcntQnt pioneers blockchain solutions for supply chains, starting in Africa, using expertise in hardware, blockchain, and data science to boost transparency and efficiency. With a focus on customer dedication, we aim to set accountability standards, driving value and sustainable growth.`,
    image = '/thumbnail.png',
    icons = [
        {
            rel: 'apple-touch-icon',
            sizes: '32x32',
            url: '/apple-touch-icon.png',
        },
        {
            rel: 'icon',
            sizes: '32x32',
            url: '/favicon-32x32.png',
        },
        {
            rel: 'icon',
            sizes: '16x16',
            url: '/favicon-16x16.png',
        },
    ],
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string | null;
    icons?: Metadata['icons'];
    noIndex?: boolean;
} = {}): Metadata => ({
    title,
    description,
    icons,
    openGraph: {
        title,
        description,
        ...(image && { images: [{ url: image }] }),
    },
    twitter: {
        title,
        description,
        ...(image && { card: 'summary_large_image', images: [image] }),
        creator: '@Sxcntqnt',
    },
    // metadataBase: new URL(process.env.NEXT_PUBLIC_APP_DOMAIN!),
    ...(noIndex && { robots: { index: false, follow: false } }),
});
